import withAuth from "/components/auth/withAuth.js";
import withFrame from "/components/Frame.js";
import DisplayCalendar from "/components/Calendar.js";
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import initFirebase from "/services/firebase.js";
import Navbar from "/components/Navbar.js";
import Footer from "/components/Footer";
import { useDocumentDataOnce } from "react-firebase-hooks/firestore";
import { useRouter } from "next/router";
import { useState } from "react";
import { set } from "react-hook-form";

initFirebase();
const auth = firebase.auth();
const db = firebase.firestore();

function OfficerDashboard() {
    const router = useRouter();
    const { uid } = router.query;
    const userRef = db.collection("users").doc(uid);
    const [data, loading, error] = useDocumentDataOnce(userRef);
    const [admingroup, setAdmingroup] = useState(null);
    const [agHours, setAgHours] = useState({});

    let events = [
        // {
        //     title: "test",
        //     start: new Date(),
        //     end: new Date(),
        //     specialType: "test",
        //     allDay?: true,
        //     resource?: any,
        // },
    ];

    // Full Chapter Meetings
    const fullChapterMeetingDates = [
        "2021-9-30",
        "2021-10-28",
        "2021-11-18",
        "2021-12-02",
        "2022-01-27",
        "2022-02-24",
        "2022-03-24",
        "2022-04-28",
        "2022-05-26",
    ];
    fullChapterMeetingDates.forEach((date) => {
        events.push({
            title: "Full Chapter Meeting",
            start: new Date(date + "T08:15"),
            end: new Date(date + "T09:00"),
            specialType: "chapter-meeting",
            allDay: false,
            resource: "https://www.google.com",
        });
    });

    function loadEvents(data) {
        // Load Opportunities
        Object.keys(data.opportunities).map((key) => {
            const opportunity = data.opportunities[key];
            events.push({
                title: "Opportunity: " + opportunity.title,
                start: new Date(
                    opportunity.date + "T" + opportunity.time_start
                ),
                end: new Date(opportunity.date + "T" + opportunity.time_end),
                specialType: "opportunity",
            });
        });
        Object.keys(data.tutoring).map((key) => {
            const pair = data.tutoring[key];
            pair.sessions.map((session) => {
                events.push({
                    title: "Tutoring: " + pair.first + " " + pair.last,
                    start: new Date(session.date + "T" + session.time_start),
                    end: new Date(session.date + "T" + session.time_end),
                    specialType: "tutoring",
                });
            });
        });
    }

    async function loadAdminGroup(data) {
        const agRef = db.collection("admin-group").doc(data.admingroup.groupId);
        agRef.get().then((snapshot) => {
            setAdmingroup(snapshot.data());
            let memberIds = [];
            snapshot.data().members.forEach((member) => {
                memberIds.push(member.uid);
            });

            const profilesRef = db
                .collection("users")
                .where(
                    firebase.firestore.FieldPath.documentId(),
                    "in",
                    memberIds
                );
            profilesRef.get().then((snapshots) => {
                let hoursdata = {};
                snapshots.forEach((snapshot) => {
                    // add snapshot.data() key value pair to agHours object
                    hoursdata = {
                        ...hoursdata,
                        [snapshot.id]: snapshot.data(),
                    };
                });
                setAgHours(hoursdata);
            });
        });
    }

    function DisplayAdminGroup() {
        if (admingroup) {
            if (Object.keys(agHours).length > 0) {
                let sums = [0, 0];
                Object.keys(agHours).forEach((key) => {
                    const hours = agHours[key].hours;
                    sums[0] += hours.volunteering;
                    sums[1] += hours.tutoring;
                });
                return (
                    <>
                        <div className="tutor-list-title">
                            Admin Group: {admingroup.officer.first}{" "}
                            {admingroup.officer.last}
                        </div>
                        <div className="admin-group-table">
                            <table className="table is-bordered is-fullwidth profile-hours-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>School ID</th>
                                        <th>Grade</th>
                                        <th>Volunteering</th>
                                        <th>Tutoring</th>
                                        <th>Total</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {admingroup.members.map((member) => {
                                        return (
                                            <tr key={member.uid}>
                                                <td>
                                                    {member.first} {member.last}
                                                </td>
                                                <td>{member.sid}</td>
                                                <td>{member.grade}</td>
                                                <td>
                                                    {
                                                        agHours[member.uid]
                                                            .hours.volunteering
                                                    }
                                                </td>
                                                <td>
                                                    {
                                                        agHours[member.uid]
                                                            .hours.tutoring
                                                    }
                                                </td>
                                                <td>
                                                    {agHours[member.uid].hours
                                                        .volunteering +
                                                        agHours[member.uid]
                                                            .hours.tutoring}
                                                </td>
                                                <td>Email</td>
                                            </tr>
                                        );
                                    })}
                                    <tr>
                                        <td>Total:</td>
                                        <td>N/A</td>
                                        <td>N/A</td>
                                        <td>{sums[0]}</td>
                                        <td>{sums[1]}</td>
                                        <td>{sums[0] + sums[1]}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </>
                );
            } else {
                console.log(agHours);
                return null;
            }
        } else {
            loadAdminGroup(data);
            return null;
        }
    }

    if (loading) {
        return <div>Loading...</div>;
    }
    if (error != undefined || data == undefined) {
        return <div></div>;
    } else {
        loadEvents(data);
        return (
            <>
                <div className="columns is-multiline tutor-list">
                    <div className="column is-full tutor-list-title">
                        Dashboard
                        <hr className="tutor-list-hr"></hr>
                    </div>
                    <div className="column is-full">
                        <DisplayAdminGroup />
                        <DisplayCalendar events={events} />
                    </div>
                </div>
            </>
        );
    }
}

export default withAuth(withFrame(OfficerDashboard, "Officer Home"), "officer");
