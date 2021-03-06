import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import { useRouter } from "next/router";
import React, { useState } from "react";
import initFirebase from "../../services/firebase.js";
import { useAuthState } from "react-firebase-hooks/auth";
import { useDocumentDataOnce } from "react-firebase-hooks/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fab, faGoogle } from "@fortawesome/free-brands-svg-icons";
import Navbar from "../../components/Navbar.js";
import Footer from "../../components/Footer";
import Profile from "../../components/Profile.js";

initFirebase();
const auth = firebase.auth();
const db = firebase.firestore();

function SignIn() {
    const router = useRouter();

    const signInWithGoogle = () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).then((results) => {
            try {
                var profile = results.additionalUserInfo.profile;
                checkProfile(profile);
            } catch (error) {
                console.error(error);
                auth.signOut();
                router.push("/login");
            }
        });
    };

    async function checkProfile(profile) {
        const profileRef = db
            .collection("users")
            .doc(firebase.auth().currentUser.uid);
        profileRef.get().then((docSnapshot) => {
            if (!docSnapshot.exists) {
                createProfile(profile);
            } else {
                router.push("/" + docSnapshot.data().role);
            }
        });
    }

    async function checkInit(email) {
        const sid = email.slice(0, -9);
        let profile = {
            role: "visitor",
            hours: null,
            grade: null,
            admingroup: null,
            sid: sid,
        };

        var regExp = /[a-zA-Z]/g;

        if (regExp.test(sid)) {
            /* do something if letters are found in your string */
            profile.role = "faculty";
            return profile;
        }

        // console.log(sid);
        const initRef = db.collection("inituser").doc(sid);
        const inituser = await initRef.get().then((snapshot) => {
            if (snapshot.exists) {
                const data = snapshot.data();
                profile.role = data.role;
                profile.hours = data.hours.carryon;
                profile.grade = data.grade;
                profile.admingroup = data.admingroup;
                return profile;
            } else {
                profile.role = "student";
                return profile;
            }
        });
        return profile;
    }

    async function createProfile(profile) {
        // Check Organization
        let org = "";
        let profileInfo = {
            role: "visitor",
            hours: null,
            grade: null,
            admingroup: null,
            sid: null,
        };
        if (typeof profile.hd != "undefined" && profile.hd === "lcps.org") {
            org = profile.hd;
            // Check Role
            profileInfo = await checkInit(profile.email);
            // console.log(role);
        } else {
            org = "exterior";
            profileInfo.role = "visitor";
        }

        // Create Profile
        const userRef = db
            .collection("users")
            .doc(firebase.auth().currentUser.uid);
        if (["visitor", "faculty", "student"].includes(profileInfo.role)) {
            await userRef.set(
                {
                    first:
                        profile.given_name.charAt(0).toUpperCase() +
                        profile.given_name.slice(1).toLowerCase(),
                    last:
                        profile.family_name.charAt(0).toUpperCase() +
                        profile.family_name.slice(1).toLowerCase(),
                    email: profile.email,
                    role: profileInfo.role,
                    badges: [],
                    profilePicture: profile.picture,
                    firstLogin: new firebase.firestore.Timestamp.now(),
                },
                { merge: true }
            );
        } else {
            const agRef = db
                .collection("admin-group")
                .doc(profileInfo.admingroup.groupId);
            agRef.get().then((snapshot) => {
                if (snapshot.exists) {
                    const agData = snapshot.data();
                    userRef
                        .set(
                            {
                                first:
                                    profile.given_name.charAt(0).toUpperCase() +
                                    profile.given_name.slice(1).toLowerCase(),
                                last:
                                    profile.family_name
                                        .charAt(0)
                                        .toUpperCase() +
                                    profile.family_name.slice(1).toLowerCase(),
                                sid: profileInfo.sid,
                                email: profile.email,
                                role: profileInfo.role,
                                hours: {
                                    carryon: profileInfo.hours,
                                    volunteering: 0,
                                    tutoring: 0,
                                },
                                grade: profileInfo.grade,
                                admingroup: {
                                    ...profileInfo.admingroup,
                                    officer: agData.officer,
                                },
                                opportunities: {},
                                tutoring: {},
                                badges: ["beta_tester"],
                                profilePicture: profile.picture,
                                firstLogin:
                                    new firebase.firestore.Timestamp.now(),
                            },
                            { merge: true }
                        )
                        .then(() => {
                            agRef
                                .update({
                                    members:
                                        firebase.firestore.FieldValue.arrayUnion(
                                            {
                                                uid: firebase.auth().currentUser
                                                    .uid,
                                                first:
                                                    profile.given_name
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                    profile.given_name
                                                        .slice(1)
                                                        .toLowerCase(),
                                                last:
                                                    profile.family_name
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                    profile.family_name
                                                        .slice(1)
                                                        .toLowerCase(),
                                                sid: profileInfo.sid,
                                                email: profile.email,
                                                grade: profileInfo.grade,
                                            }
                                        ),
                                })
                                .then(() => {
                                    router.push("/welcome/member");
                                });
                        });
                }
            });
        }
    }

    return (
        <>
            <Navbar />
            <div className="body-container">
                <div className="login-box">
                    <span className="log-in-text">User Login</span>
                    <a className="sign-in" onClick={signInWithGoogle}>
                        <span className="google-icon">
                            <FontAwesomeIcon
                                icon={fab.faGoogle}></FontAwesomeIcon>
                        </span>
                        Sign in with Google
                    </a>
                    <span className="middle-text">SY 2021 - 2022</span>
                    <div className="bottom-logos">
                        <img className="bottom-nhs" src="/images/nhslogo.png" />
                        <span className="bottom-text">
                            Riverside National Honor Society
                        </span>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}

function postLoginActions(uid) {
    const router = useRouter();
    const profileRef = db.collection("users").doc(uid);
    profileRef.get().then((docSnapshot) => {
        if (!docSnapshot.exists) {
            // auth.signOut();
            // router.push("/login/");
        } else {
            router.push("/" + docSnapshot.data().role);
        }
    });
}

function Login() {
    const router = useRouter();
    const { dest } = router.query;
    const [user, loading, error] = useAuthState(auth);

    if (loading) {
        return <>Fetching data...</>;
    }
    if (error != undefined || user == undefined) {
        return <SignIn />;
    } else {
        // router.push("/" + dest);
        // postLoginActions(user.uid);
        return <>Routing</>;
    }
}

export default Login;
