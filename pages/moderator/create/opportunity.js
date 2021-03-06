import firebase from "firebase/app";
import "firebase/firestore";
import initFirebase from "/services/firebase.js";
import Navbar from "/components/Navbar.js";
import Footer from "/components/Footer";
import { useForm, useFieldArray } from "react-hook-form";
import { useRouter } from "next/router";
import withAuth from "/components/auth/withAuth.js";
import withFrame from "/components/Frame.js";
import sendEmail from "/components/email/sendEmail.js";
import swal from "sweetalert";

initFirebase();
const db = firebase.firestore();

function CreateOpportunity() {
    const router = useRouter();
    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "tasks",
    });

    async function onSubmitForm(values) {
        let emailBody = "";
        let emailHtml = `A new volunteer opportunity has opened! Visit https://rvhnhs.vercel.app/ to register. <br> <br> Date: ${values.date} <br> Time: ${values.starttime} - ${values.endtime} <br>Location: ${values.location} <br> <br> Description: ${values.desc} <br><br> Tasks:<br>`;
        let tasklist = values.tasks;
        Array.from(
            tasklist.map((element) => {
                element["registrations"] = [];
                emailHtml =
                    emailHtml +
                    `&nbsp;&nbsp;&nbsp;&nbsp;<b>${element.title}</b><br>&nbsp;&nbsp;&nbsp;&nbsp;${element.description}<br>&nbsp;&nbsp;&nbsp;&nbsp;Positions Open: ${element["max-registrants"]}<br>&nbsp;&nbsp;&nbsp;&nbsp;Hours: ${element.hours}<br><br>`;
                return element;
            })
        );
        emailHtml += `We hope to see you there!`;
        const eventRef = db.collection("opportunities");

        await eventRef
            .add(
                {
                    title: values.title,
                    description: values.desc,
                    date: values.date,
                    "start-time": values.starttime,
                    "end-time": values.endtime,
                    location: values.location,
                    picture: values.picture,
                    tasks: tasklist,
                    "time-created": new firebase.firestore.Timestamp.now(),
                },
                { merge: false }
            )
            .then(function (docRef) {
                // console.log(docRef.id);
                const masterRef = db.collection("opportunities").doc("master");
                masterRef.update({
                    ongoing: firebase.firestore.FieldValue.arrayUnion({
                        description: values.desc,
                        eid: docRef.id,
                        title: values.title,
                        picture: values.picture,
                    }),
                });
            })

            .then(() => {
                sendEmail(
                    "member",
                    "New NHS Opportunity: " + values.title,
                    "New Opportunity: " + values.title + "!",
                    emailHtml
                );
            })
            .then(() => {
                swal(
                    "Opportunity Added!",
                    "Event " + values.title + " successfully created.",
                    "success"
                );
                router.push("/member/opportunities");
            });
    }

    return (
        <div>
            <br></br>
            <div className="create-opportunity-title">Create Opportunity</div>
            <hr></hr>
            <form
                className="create-opportunity-form"
                onSubmit={handleSubmit(onSubmitForm)}>
                <div className="field">
                    <label className="label">
                        Title
                        <div className="control">
                            <input
                                className="input"
                                type="text"
                                {...register("title", {
                                    required: true,
                                })}></input>
                            <span className="help is-danger">
                                {errors.title?.type === "required" &&
                                    "Title is required."}
                            </span>
                        </div>
                    </label>
                </div>
                <div className="field">
                    <label className="label">
                        Description
                        <div className="control">
                            <input
                                className="input"
                                type="text"
                                name="desc"
                                {...register("desc")}></input>
                            <span className="help is-danger">
                                {errors.desc?.type === "required" &&
                                    "Description is required."}
                            </span>
                        </div>
                    </label>
                </div>
                <div className="field">
                    <label className="label">
                        Date
                        <div className="control">
                            <input
                                className="input"
                                type="date"
                                name="desc"
                                {...register("date", {
                                    required: true,
                                })}></input>
                            <span className="help is-danger">
                                {errors.date?.type === "required" &&
                                    "Date is required."}
                            </span>
                        </div>
                    </label>
                </div>
                <div className="field is-grouped">
                    <label className="label">
                        Start Time
                        <div className="control">
                            <input
                                className="input"
                                type="time"
                                name="starttime"
                                {...register("starttime", {
                                    required: true,
                                })}></input>
                            <span className="help is-danger">
                                {errors.starttime?.type === "required" &&
                                    "Start Time is required."}
                            </span>
                        </div>
                    </label>
                    <label className="label">
                        End time
                        <div className="control">
                            <input
                                className="input"
                                type="time"
                                name="endtime"
                                {...register("endtime", {
                                    required: true,
                                })}></input>
                            <span className="help is-danger">
                                {errors.endtime?.type === "required" &&
                                    "Date is required."}
                            </span>
                        </div>
                    </label>
                </div>
                <div className="field">
                    <label className="label">
                        Location
                        <div className="control">
                            <input
                                className="input"
                                type="text"
                                name="location"
                                {...register("location", {
                                    required: true,
                                })}></input>
                            <span className="help is-danger">
                                {errors.location?.type === "required" &&
                                    "Location is required."}
                            </span>
                        </div>
                    </label>
                </div>
                <div className="field">
                    <label className="label">
                        Picture URL
                        <div className="control">
                            <input
                                className="input"
                                type="text"
                                name="picture"
                                {...register("picture")}></input>
                            <span className="help is-danger">
                                {errors.picture?.type === "required" &&
                                    "Location is required."}
                            </span>
                        </div>
                    </label>
                </div>

                {/* Tasks */}
                <div className="field">
                    <label className="label">
                        Tasks
                        {fields.map(({ id }, index) => {
                            return (
                                <div className="control" key={id}>
                                    <label className="label task-label">
                                        Task {index + 1}
                                        <label className="label">
                                            Title
                                            <input
                                                className="input"
                                                type="text"
                                                name={`tasks[${index}].title`}
                                                {...register(
                                                    `tasks[${index}].title`
                                                )}></input>
                                        </label>
                                        <label className="label">
                                            Description
                                            <input
                                                className="input"
                                                type="text"
                                                name={`tasks[${index}].description`}
                                                {...register(
                                                    `tasks[${index}].description`
                                                )}></input>
                                        </label>
                                        <label className="label">
                                            Maximum Registrants
                                            <input
                                                className="input"
                                                type="number"
                                                name={`tasks[${index}].max-registrants`}
                                                min={1}
                                                step={1}
                                                {...register(
                                                    `tasks[${index}].max-registrants`
                                                )}></input>
                                        </label>
                                        <label className="label">
                                            Hours Offered
                                            <input
                                                className="input"
                                                type="number"
                                                min={0.25}
                                                step={0.25}
                                                name={`tasks[${index}].hours`}
                                                {...register(
                                                    `tasks[${index}].hours`
                                                )}></input>
                                        </label>
                                        <input
                                            className="button is-danger"
                                            type="button"
                                            value="Delete"
                                            onClick={() =>
                                                remove(index)
                                            }></input>
                                    </label>
                                </div>
                            );
                        })}
                    </label>
                </div>

                <div className="field">
                    <input
                        className="button is-info"
                        type="button"
                        value="Add Tasks"
                        onClick={() => append({})}></input>
                </div>

                {/* Submission */}
                <hr></hr>
                <div className="field is-grouped">
                    <div className="control">
                        <input
                            className="button is-success"
                            type="submit"
                            name="submit"
                            value="Submit"></input>
                    </div>
                    <div className="control">
                        <input
                            className="button is-danger"
                            type="button"
                            name="cancel"
                            value="Cancel"
                            onClick={() => {
                                router.push("/officer/admingroup");
                            }}></input>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default withAuth(
    withFrame(CreateOpportunity, "Create Opportunity"),
    "moderator"
);
