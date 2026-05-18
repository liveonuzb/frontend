import React from "react";
import { useNavigate, useParams } from "react-router";
import PageLoader from "@/components/page-loader/index.jsx";

import { trim } from "lodash";

const ReferralRedirectPage = () => {
  const navigate = useNavigate();
  const { code = "" } = useParams();

  React.useEffect(() => {
    let isMounted = true;
    const normalizedCode = trim(code);
    const target = `/join${
      normalizedCode ? `?ref=${encodeURIComponent(normalizedCode)}` : ""
    }`;

    const redirect = () => {
      if (isMounted) {
        navigate(target, { replace: true });
      }
    };

    redirect();

    return () => {
      isMounted = false;
    };
  }, [code, navigate]);

  return <PageLoader />;
};

export default ReferralRedirectPage;
