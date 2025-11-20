import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "../../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Loader2, Lock, Mail } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, "Required"),
  password: z.string().min(1, "Required"),
});

export default function LoginCard() {
  const loginMutation = useLogin();
  //   const [errorMsg, setErrorMsg] = useState("");

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: "",
      password: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      await loginMutation.mutateAsync(values);
    } catch (err) {
      toast.error(err.message || "Login failed");
    }
  };

  return (
    <Card className="shadow-xl border border-border/40 backdrop-blur-sm bg-card/80">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <CardDescription className="text-muted-foreground">
          Log in to continue to your dashboard
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Email / Username */}
          <div className="space-y-1">
            <Label>Email or Username</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                {...form.register("emailOrUsername")}
                className="pl-10"
                placeholder="Enter email or username"
              />
            </div>
            {form.formState.errors.emailOrUsername && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.emailOrUsername.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <Label>Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                {...form.register("password")}
                className="pl-10"
                placeholder="Enter password"
              />
            </div>
            {form.formState.errors.password && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* Error */}
          {/* {errorMsg && (
            <p className="text-red-500 text-center text-sm">{errorMsg}</p>
          )} */}

          <Button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full h-11 text-base"
          >
            {loginMutation.isPending ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              "Login"
            )}
          </Button>
        </form>
      </CardContent>

      {/* <CardFooter className="flex justify-center">
        <a
          href="/forgot-password"
          className="text-sm text-primary hover:underline"
        >
          Forgot password?
        </a>
      </CardFooter> */}
    </Card>
  );
}
