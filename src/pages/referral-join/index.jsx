import React from "react";
import { useNavigate, useSearchParams } from "react-router";
import PageLoader from "@/components/page-loader/index.jsx";
import { api } from "@/hooks/api/use-api";

const JoinReferralPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  React.useEffect(() => {
    let isMounted = true;
    const referralCode = searchParams.get("ref")?.trim() ?? "";
    const wasTracked = searchParams.get("tracked") === "1";
    const target = `/auth/sign-up${
      referralCode ? `?ref=${encodeURIComponent(referralCode)}` : ""
    }`;

    const redirect = async () => {
      if (referralCode && !wasTracked) {
        await api
          .get(`/coach/referrals/track/${encodeURIComponent(referralCode)}`)
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
  }, [navigate, searchParams]);

  return <PageLoader />;
};

export default JoinReferralPage;
