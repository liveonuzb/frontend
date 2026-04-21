import React from "react";
import { useNavigate, useParams } from "react-router";
import PageLoader from "@/components/page-loader/index.jsx";
import { api } from "@/hooks/api/use-api";

const ReferralRedirectPage = () => {
  const navigate = useNavigate();
  const { code = "" } = useParams();

  React.useEffect(() => {
    let isMounted = true;
    const normalizedCode = code.trim();
    const target = `/auth/sign-up${
      normalizedCode ? `?ref=${encodeURIComponent(normalizedCode)}` : ""
    }`;

    const redirect = async () => {
      if (normalizedCode) {
        await api
          .get(`/coach/referrals/track/${encodeURIComponent(normalizedCode)}`)
          .catch(() => {});
      }

      if (isMounted) {
        navigate(target, { replace: true });
      }
    };

    void redirect();

    return () => {
      isMounted = false;
    };
  }, [code, navigate]);

  return <PageLoader />;
};

export default ReferralRedirectPage;
