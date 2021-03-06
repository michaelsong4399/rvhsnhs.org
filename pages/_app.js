import "rc-steps/assets/index.css";
import "rc-steps/assets/iconfont.css";
import "../node_modules/react-image-gallery/styles/css/image-gallery.css";
import "../node_modules/bulma/css/bulma.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../styles/index.css";
import Router from "next/router";
import NProgress from "nprogress"; //nprogress module
import "../node_modules/nprogress/nprogress.css"; //styles of nprogress
import React, { useEffect } from "react";
import "../styles/index.css";
//Binding events.

Router.events.on("routeChangeStart", () => NProgress.start());
Router.events.on("routeChangeComplete", () => NProgress.done());
Router.events.on("routeChangeError", () => NProgress.done());

function MyApp({ Component, pageProps }) {
    return <Component {...pageProps} />;
}

export default MyApp;
