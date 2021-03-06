import { useRouter } from "next/router";
import { useEffect } from "react";

function LoginRoute() {
    const router = useRouter();
    useEffect(() => {
        router.push("/login/user");
    });
    return <>Routing to member login...</>;
}

export default LoginRoute;
