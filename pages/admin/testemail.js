import withAuth from "/components/auth/withAuth.js";
import sendEmail from "/components/email/sendEmail.js";

function writeEmail() {
    const emailBody = `<!DOCTYPE html><html> <head> <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"> <style> @import url("https://fonts.googleapis.com/css2?family=Oxygen"); @import url(https://fonts.googleapis.com/css?family=Montserrat:400,500,800,900,80); .wrapper{ width: 100%; } .header{ background-color: #0e447b; padding-top: 1%; padding-left: 5%; padding-right: 5%; width: 90%; text-align: center; } .top-nhs-logo{ width: 8rem; } .header .title{ margin-top: -1rem; font-family: 'Montserrat', sans-serif; color: white; font-size: 3rem; font-weight: 700; padding-bottom: 1%; } .header .subtitle{ font-family: 'Oxygen', sans-serif; color: white; font-size: 2rem; padding-bottom: 3%; } .body{ background-color: #F1F1E6; padding-top: 5%; padding-left: 10%; padding-right: 10%; width: 80%; } .body .title{ color: #2793fa; font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 2rem; } .body .text{ font-family: 'Oxygen', sans-serif; color: black; font-size: 1.2rem; padding-bottom: 5%; } .footer{ background-color: #0e447b; padding-left: 5%; padding-right: 5%; padding-bottom: 5%; width: 90%; text-align: center; } .footer .motto{ font-family: 'Montserrat', sans-serif; color: white; font-size: 2rem; font-weight: 700; padding-top: 5%; padding-bottom: 1rem; } .fa { padding: 1rem; font-size: 30px; width: 30px; text-align: center; text-decoration: none; color: white; transition: 0.3s all; } .fa:hover { color: #2793fa; transition: 0.3s all; } .footer .socials { position: relative; text-align: center; } .footer .info{ font-family: "Oxygen",sans-serif; color: white; } .footer .info a{ color: white; transition: 0.3s all; } .footer .info a:hover{ color: #2793fa; transition: 0.3s all; } </style> </head> <body> <div className="wrapper"> <div className="header"> <img className="top-nhs-logo" src="https://firebasestorage.googleapis.com/v0/b/rvhnhs.appspot.com/o/email%2Fnhs_white.png?alt=media&token=72839346-da98-4fe7-8b18-e5d4528cefbb"/> <div className="title"> National Honor Society </div> <div className="subtitle"> Riverside Chapter </div> </div> <div className="divider"></div> <div className="body"> <div className="title"> We Want Your Words! </div> <div className="text"> Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, </div> <div className="title"> We Want Your Words! </div> <div className="text"> Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, </div> </div> <div className="footer"> <div className="motto"> VOLUNTEER, ADVOCATE, SERVE </div> <div className="socials"> <a href="#" className="fa fa-twitter"></a> <a href="#" className="fa fa-facebook"></a> <a href="#" className="fa fa-instagram"></a> </div> <div className="info"> No longer want to receive these emails? <a href="https://rvhnhs.vercel.app/" className="unsubscribe-text">Unsubscribe</a>. <br> 19019 Upper Belmont Pl, Leesburg, VA 20176 </div> </div> </div> </body></html>`;
    sendEmail("1036566@lcps.org", "Test Email2", "", emailBody);
}

function TestEmail() {
    return (
        <a
            onClick={() => {
                writeEmail();
            }}>
            Send Email
        </a>
    );
}

export default withAuth(TestEmail, "admin");
