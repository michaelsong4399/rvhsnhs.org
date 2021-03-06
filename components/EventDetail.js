import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/storage";
import initFirebase from "/services/firebase.js";
import { useRouter } from "next/router";
import { useDocumentDataOnce } from "react-firebase-hooks/firestore";
import { useState, useRef } from "react";
import sendEmail from "/components/email/sendEmail.js";
import { useForm } from "react-hook-form";
import swal from "sweetalert";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

initFirebase();
const db = firebase.firestore();
const fs = firebase.storage();

function EventDetail({ data, uid, eid }) {
    const router = useRouter();
    const profileRef = db.collection("users").doc(uid);
    const [value, loading, error] = useDocumentDataOnce(profileRef);
    const [disable, setDisable] = useState(false);
    const [verify, setVerify] = useState("false");
    const [registerModal, setRegisterModal] = useState("false");
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);
    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm();
    let emailHtml = "";

    function completeVerification(task, index, first, last, email, type, url) {
        if (type === "file") {
            const caseRef = db.collection("hours-submitted");
            caseRef
                .add({
                    first: first,
                    last: last,
                    eid: eid,
                    event_title: data.title,
                    tid: index,
                    task_title: task.title,
                    task_description: task.description,
                    hours: task.hours,
                    uid: uid,
                    url: url,
                    timestamp: new firebase.firestore.Timestamp.now(),
                })
                .then(function (docRef) {
                    console.log("Case Created.");
                    const userRef = db.collection("users").doc(uid);
                    userRef.update({
                        [`opportunities.${eid}.status`]: "submitted",
                        [`opportunities.${eid}.verification_type`]: "file",
                        [`opportunities.${eid}.case`]: docRef.id,
                    });
                })
                .then(() => {
                    emailHtml = `Your photo verification submission for <b>${data.title}</b>, <b>${task.title}</b>, has been received. You will receive a verification email once the submission has been approved.`;
                    sendEmail(
                        email,
                        "Receipt: Verification Photo for " + data.title,
                        "Received!",
                        emailHtml
                    );
                })
                .then(() => {
                    console.log("User Info Updated.");
                    setVerify(false);
                    setProgress(0);
                    setDisable(true);
                    swal(
                        "Submitted!",
                        "Your verification image has been uploaded.",
                        "success"
                    ).then(() => {
                        router.reload(window.location.pathname);
                    });
                });
        }
        if (type === "email") {
        }
    }

    function uploadFile(taskinfo, index, first, last, email) {
        if (fileInputRef.current.files[0] != null) {
            if (isFileImage(fileInputRef.current.files[0])) {
                if (fileInputRef.current.files[0].size <= 1000000) {
                    var file = fileInputRef.current.files[0];
                    var storageRef = fs.ref(eid + "/" + uid);
                    var task = storageRef.put(file);
                    // console.log(taskinfo, index);
                    task.on(
                        "state_change",
                        function progress(snapshot) {
                            setProgress(
                                (snapshot.bytesTransferred /
                                    snapshot.totalBytes) *
                                    100
                            );
                        },
                        function error(err) {
                            console.log("Error: ", err);
                        },
                        function complete() {
                            console.log("Upload Complete");
                            storageRef.getDownloadURL().then((url) => {
                                completeVerification(
                                    taskinfo,
                                    index,
                                    first,
                                    last,
                                    email,
                                    "file",
                                    url
                                );
                            });
                        }
                    );
                } else {
                    swal(
                        "Oops!",
                        "File size too large. Please submit a file smaller than 1MB.",
                        "warning"
                    );
                }
            } else {
                swal("Oops!", "Please upload an image file.", "warning");
            }
        } else {
            swal("Oops!", "Please choose a file to upload.", "warning");
        }
    }

    function isFileImage(file) {
        const acceptedImageTypes = [
            "image/gif",
            "image/jpeg",
            "image/png",
            "image/jpg",
            "image/svg",
        ];

        return file && acceptedImageTypes.includes(file["type"]);
    }

    function validateEmail(email) {
        const re =
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    function VerifyModal({ task, index, first, last, email }) {
        async function onSubmitForm(values) {
            console.log(values);
            if (!validateEmail(values.email)) {
                swal("Oops!", "Please enter a valid email.", "warning");
                return;
            }

            const emailCaseRef = db.collection("hours-emailed");
            emailCaseRef
                .add({
                    first: first,
                    last: last,
                    eid: eid,
                    event_title: data.title,
                    tid: index,
                    task_title: task.title,
                    task_description: task.description,
                    hours: task.hours,
                    uid: uid,
                    timestamp: new firebase.firestore.Timestamp.now(),
                })
                .then(function (docRef) {
                    console.log("Case Created.");
                    const userRef = db.collection("users").doc(uid);
                    userRef
                        .update({
                            [`opportunities.${eid}.status`]: "submitted",
                            [`opportunities.${eid}.verification_type`]: "email",
                            [`opportunities.${eid}.case`]: docRef.id,
                        })
                        .then(() => {
                            const verifyLink =
                                "https://rvhnhs.vercel.app/teacher/verify/" +
                                docRef.id;
                            emailHtml = `A verification of particiption has been requested from <b>${first}</b> <b>${last}</b> for his/her participation in <b>${data.title}</b>, <b>${task.title}</b>.Please click the following link to verify <b>${first}</b>'s participation: ${verifyLink}`;
                            sendEmail(
                                values.email,
                                "Verification Needed: " +
                                    first +
                                    ", " +
                                    last +
                                    ", " +
                                    task.title,
                                "Verification Needed!",
                                emailHtml
                            );
                        })
                        .then(() => {
                            emailHtml = `A an email request regarding your participation in <b>${data.title}</b>, <b>${task.title}</b> has been sent to <b>${values.email}</b>. You will receive a verification email once the submission has been approved.`;
                            sendEmail(
                                email,
                                "Request Sent: " +
                                    task.title +
                                    " to " +
                                    values.email,
                                "Verification Request Sent!",
                                emailHtml
                            );
                        })
                        .then(() => {
                            swal(
                                "Submitted!",
                                "Your verification email has been sent.",
                                "success"
                            ).then(() => {
                                router.reload(window.location.pathname);
                            });
                        });
                });
        }

        if (verify == "selection") {
            return (
                <div className={"modal is-active"} id="verify-modal">
                    <div
                        className="modal-background"
                        onClick={() => {
                            setVerify("false");
                            setProgress(0);
                        }}></div>
                    <div
                        className="modal-content verify-modal-content columns is-multiline"
                        id="selection-modal-content">
                        <div className="verify-modal-title column is-full">
                            Verify Event
                            <hr className="verify-modal-line"></hr>
                        </div>
                        <div className="verify-modal-description column is-full">
                            Select a verification method.
                        </div>
                        <div className="verify-modal-button-wrapper column is-full">
                            <a
                                className="button is-warning "
                                onClick={() => {
                                    setVerify("file");
                                }}>
                                Submit Image
                            </a>
                        </div>

                        <div className="column is-full">OR</div>
                        <div className="verify-modal-button-wrapper column is-full">
                            <a
                                className="button is-warning "
                                onClick={() => {
                                    setVerify("email");
                                }}>
                                Email Verification
                            </a>
                        </div>
                    </div>
                    <button
                        className="modal-close is-large"
                        aria-label="close"
                        onClick={() => {
                            setVerify("false");
                            setProgress(0);
                        }}></button>
                </div>
            );
        } else if (verify == "file") {
            return (
                <div className={"modal is-active"} id="verify-modal">
                    <div
                        className="modal-background"
                        onClick={() => {
                            setVerify("false");
                            setProgress(0);
                        }}></div>
                    <div
                        className="modal-content verify-modal-content columns is-multiline"
                        id="email-modal-content">
                        <div className="verify-modal-title column is-full">
                            Image Submission
                            <hr className="verify-modal-line"></hr>
                        </div>
                        <div className="verify-modal-description column is-full">
                            Submit an acceptable image to verify your attendance
                            of the event.
                        </div>
                        <div className="verify-modal-input-wrapper column is-full">
                            <input
                                className="hidden verify-modal-input"
                                type="file"
                                ref={fileInputRef}></input>
                        </div>
                        <div className="verify-modal-progress column is-full">
                            <progress
                                className="progress is-info"
                                value={progress}
                                max={100}></progress>
                        </div>
                        <div className="verify-modal-button-wrapper column is-full">
                            <a
                                className="button is-success"
                                onClick={() => {
                                    uploadFile(task, index, first, last, email);
                                }}>
                                Submit
                            </a>
                        </div>
                    </div>
                    <button
                        className="modal-close is-large"
                        aria-label="close"
                        onClick={() => {
                            setVerify("false");
                            setProgress(0);
                        }}></button>
                </div>
            );
        } else if (verify == "email") {
            return (
                <div className={"modal is-active"} id="verify-modal">
                    <div
                        className="modal-background"
                        onClick={() => {
                            setVerify("false");
                            setProgress(0);
                        }}></div>
                    <div
                        className="modal-content verify-modal-content columns is-multiline"
                        id="email-modal-content">
                        <div className="verify-modal-title column is-full">
                            Email Submission
                            <hr className="verify-modal-line"></hr>
                        </div>
                        <div className="verify-modal-description column is-full">
                            Send an email to the faculty responsible for the
                            event for validation. Please submit the email
                            address below.
                        </div>
                        <div className="verify-modal-input-wrapper column is-full">
                            <form
                                className="verify-email-form"
                                onSubmit={handleSubmit(onSubmitForm)}>
                                <div className="field">
                                    <div className="control">
                                        <input
                                            className="input"
                                            type="email"
                                            {...register("email", {
                                                required: true,
                                            })}></input>
                                        <span className="help is-danger">
                                            {errors.email?.type ===
                                                "required" &&
                                                "A valid email is required."}
                                        </span>
                                    </div>
                                </div>
                                <div className="field">
                                    <div className="control">
                                        <input
                                            className="button is-success"
                                            type="submit"
                                            name="submit"
                                            value="Submit"></input>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                    <button
                        className="modal-close is-large"
                        aria-label="close"
                        onClick={() => {
                            setVerify("false");
                            setProgress(0);
                        }}></button>
                </div>
            );
        } else {
            return null;
        }
    }

    function RegisterModal({ index, setDisable, email }) {
        if (registerModal === index) {
            return (
                <div className={"modal is-active"} id="tutee-approve-modal">
                    <div
                        className="modal-background"
                        onClick={() => {
                            setRegisterModal("false");
                        }}></div>
                    <div className="modal-content tutee-approve-modal-content columns is-multiline">
                        <div className="tutee-approve-modal-title column is-full">
                            Verify Registration Information
                            <hr className="tutee-approve-modal-line"></hr>
                        </div>

                        <div className="columns is-multiline is-mobile tutee-modal is-gapless"></div>
                        <div className="warning-text">
                            Please double check all fields before submitting
                            this registration. Once registered, you are
                            responsible for scheduling and providing your own
                            transportation to this event unless specified
                            otherwise in event description.
                        </div>
                        <div className="tutee-approve-modal-actions">
                            <a
                                className="tutee-modal-accept"
                                onClick={() => {
                                    startRegister(index, setDisable, email);
                                }}>
                                Submit
                                <span className="hero-button-icon">
                                    <FontAwesomeIcon
                                        icon={faArrowRight}></FontAwesomeIcon>
                                </span>
                            </a>
                            <a
                                className="tutee-modal-cancel"
                                onClick={() => {
                                    setRegisterModal("false");
                                }}>
                                Cancel
                                <span className="hero-button-icon">
                                    <FontAwesomeIcon
                                        icon={faArrowRight}></FontAwesomeIcon>
                                </span>
                            </a>
                        </div>
                        <br></br>
                    </div>
                    <button
                        className="modal-close is-large"
                        aria-label="close"
                        onClick={() => {
                            setRegisterModal("false");
                        }}></button>
                </div>
            );
        } else {
            return null;
        }
    }
    function RegisterButton({ task, index, disable }) {
        if (loading) {
            return <a className="event-detail-tasks-register">Loading...</a>;
        }
        if (error != undefined || data == undefined) {
            return <a className="event-detail-tasks-register">Error!</a>;
        } else {
            let existing_registration = value.opportunities[eid];
            if (existing_registration) {
                if (
                    existing_registration.task_id.toString() ===
                    index.toString()
                ) {
                    if (
                        existing_registration.status.toString() === "registered"
                    ) {
                        return (
                            <>
                                <a
                                    className="event-detail-tasks-register is-registered"
                                    onClick={() => {
                                        setVerify("selection");
                                    }}>
                                    Verify
                                </a>
                                <VerifyModal
                                    task={task}
                                    index={index}
                                    first={value.first}
                                    last={value.last}
                                    email={value.email}
                                />
                            </>
                        );
                    } else if (
                        existing_registration.status.toString() === "submitted"
                    ) {
                        return (
                            <>
                                <a className="event-detail-tasks-register is-submitted">
                                    Submitted
                                </a>
                            </>
                        );
                    } else if (
                        existing_registration.status.toString() === "verified"
                    ) {
                        return (
                            <>
                                <a className="event-detail-tasks-register is-verified">
                                    Verified
                                </a>
                            </>
                        );
                    }
                } else {
                    return (
                        <a className="event-detail-tasks-register is-locked">
                            Unavailable
                        </a>
                    );
                }
            } else if (
                task["max-registrants"] - task.registrations.length <=
                0
            ) {
                return (
                    <a className={"event-detail-tasks-register is-locked"}>
                        Unavailable
                    </a>
                );
            } else {
                if (disable) {
                    return null;
                } else {
                    return (
                        <>
                            <RegisterModal
                                index={index}
                                setDisable={setDisable}
                                email={value.email}
                            />
                            <a
                                className={"event-detail-tasks-register"}
                                onClick={() => {
                                    console.log(index);
                                    setRegisterModal(index);
                                }}>
                                Register
                            </a>
                        </>
                    );
                }
            }
        }
    }

    async function startRegister(index, setDisable, email) {
        setDisable(true);
        const taskRef = db.collection("opportunities").doc(eid);
        let updatedTasks = await taskRef.get().then((snapshot) => {
            let currTasks = snapshot.data().tasks;
            if (
                currTasks[index].registrations.find(
                    (element) => element === uid
                )
            ) {
                swal(
                    "Oops!",
                    "You have already signed up for this task! Refreshing page.",
                    "warning"
                ).then(() => {
                    router.reload(window.location.pathname);
                });
            }
            if (
                currTasks[index].registrations.length <
                currTasks[index]["max-registrants"]
            ) {
                currTasks[index].registrations.push(uid);
            } else {
                swal(
                    "Oops!",
                    "All spots filled for this task! Refreshing page.",
                    "warning"
                ).then(() => {
                    router.reload(window.location.pathname);
                });
            }
            return currTasks;
        });
        console.log(updatedTasks);

        await taskRef
            .update({
                tasks: updatedTasks,
            })
            .then(() => {
                taskRef.get().then((snapshot) => {
                    let currTasks = snapshot.data().tasks;
                    if (
                        currTasks[index].registrations.find(
                            (element) => element === uid
                        )
                    ) {
                        console.log("Success!");
                        const userRef = db.collection("users").doc(uid);
                        userRef
                            .update({
                                [`opportunities.${eid}`]: {
                                    title: data.title,
                                    task_id: index,
                                    task_title: data.tasks[index].title,
                                    status: "registered",
                                    date: data.date,
                                    time_start: data["start-time"],
                                    time_end: data["end-time"],
                                    hours: data.tasks[index].hours,
                                    timestamp:
                                        new firebase.firestore.Timestamp.now(),
                                },
                            })
                            .then(() => {
                                emailHtml = `Thank you for registering for <b>${data.title}</b>, <b>${data.tasks[index].title}</b>! Take this email as your confirmation. Make sure you attend <b>${data.title}</b> on <b>${data.date}</b> from <b>${data["start-time"]}</b> to <b>${data["end-time"]}</b> at <b>${data.location}</b>. Don't forget to submit a verification <a href="https://rvhnhs.vercel.app/member/opportunities/${eid}">here</a> after event completion.`;
                                sendEmail(
                                    email,
                                    "Registered: " +
                                        data.title +
                                        ", " +
                                        data.tasks[index].title,
                                    "Registered!",
                                    emailHtml
                                );
                            })
                            .then(() => {
                                swal(
                                    "Success!",
                                    "Your registration has been approved.",
                                    "success"
                                ).then(() => {
                                    router.reload(window.location.pathname);
                                });
                            });
                    } else {
                        swal(
                            "Oops!",
                            "All spots filled for this task! Refreshing page.",
                            "warning"
                        ).then(() => {
                            router.reload(window.location.pathname);
                        });
                    }
                });
            });
    }

    return (
        <div className="event-detail">
            <div
                className="event-detail-title"
                style={{
                    backgroundImage: `url("` + data.picture + `")`,
                }}>
                <div className="event-detail-title-overlay">
                    <div>{data.title}</div>
                </div>
            </div>
            <div className="event-detail-descriptions">
                <div className="event-detail-descriptions-title">
                    Event Details
                </div>
                <hr></hr>
                <div className="event-detail-date">Date: {data.date}</div>
                <div className="event-detail-time">
                    Time: {data["start-time"]} - {data["end-time"]}
                </div>
                <div className="event-detail-time">
                    Location: {data.location}
                </div>
                <br></br>
                <div className="event-detail-description">
                    {data.description}
                </div>
            </div>
            <div className="event-detail-tasks">
                <div className="event-detail-descriptions-title">Tasks</div>
                <hr></hr>
                <table className="table is-bordered is-fullwidth event-detail-tasks-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Hours </th>
                            <th>Availability</th>
                            <th>Register</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.tasks.map((task, index) => {
                            return (
                                <tr key={index}>
                                    <td>{task.title}</td>
                                    <td>{task.description}</td>
                                    <td>{task.hours}</td>
                                    <td>
                                        {task["max-registrants"] -
                                            task.registrations.length}{" "}
                                        out of {task["max-registrants"] + " "}
                                        spots available
                                    </td>
                                    <td className="event-detail-tasks-register-wrapper">
                                        <RegisterButton
                                            task={task}
                                            index={index}
                                            disable={disable}
                                            setDisable={setDisable}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default EventDetail;
