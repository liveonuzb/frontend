import React from "react";
import { Link } from "react-router";
import { useQueryState, parseAsStringEnum } from "nuqs";
import { cn } from "@/lib/utils";
import { FieldDescription, FieldGroup } from "@/components/ui/field";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { get } from "lodash";

import EmailForm from "./email-form";
import PhoneForm from "./phone-form";

const Index = ({ className, ...props }) => {
  const { t } = useTranslation();
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringEnum(["email", "phone"]).withDefault("email"),
  );

  return (
    <div
      className={cn(
        "flex justify-center flex-col gap-6 flex-grow max-w-md",
        className,
      )}
      {...props}
    >
      <div className="p-6 md:p-8 ">
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">
              {t("auth.forgotPassword.title")}
            </h1>
            <p className="text-muted-foreground text-balance">
              {t("auth.forgotPassword.subtitle")}
            </p>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className={"w-full"}>
              <TabsTrigger value="email">
                {t("auth.forgotPassword.emailTab")}
              </TabsTrigger>
              <TabsTrigger value="phone">
                {t("auth.forgotPassword.phoneTab")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <EmailForm />
            </TabsContent>

            <TabsContent value="phone">
              <PhoneForm />
            </TabsContent>
          </Tabs>

          <FieldDescription className="text-center">
            {t("auth.forgotPassword.rememberPassword")}{" "}
            <Link to="/auth/sign-in">
              {t("auth.forgotPassword.backToSignIn")}
            </Link>
          </FieldDescription>
        </FieldGroup>
      </div>
    </div>
  );
};

export default Index;
