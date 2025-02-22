import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import { toast } from "sonner";
import { MessageCircle, Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { auth } from "@/lib/api";
import { authState } from "@/lib/atoms";
import { setWithExpiry } from "@/lib/utils";

export function Login() {
  const navigate = useNavigate();
  const setAuth = useSetRecoilState(authState);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const data = await auth.login(email, password);
      setAuth({ token: data.token, user: data.data.user });

      setWithExpiry("token", data.token, 1000 * 60 * 60 * 1); // 1 hour
      setWithExpiry("user", JSON.stringify(data.data.user), 1000 * 60 * 60 * 1); // 1 hour
      toast.success("Login successful");
      navigate("/chats");
    } catch {
      toast.error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-green-500/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
            Welcome Back
          </h1>
        </div>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                    disabled={loading}
                    className="pl-9 bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:ring-green-500/20 focus:border-green-500/50"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    disabled={loading}
                    className="pl-9 bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:ring-green-500/20 focus:border-green-500/50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 text-white transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </CardContent>
          </form>

          <CardFooter className="flex flex-col space-y-4 border-t border-zinc-700 bg-zinc-800/30">
            <p className="text-sm text-center text-zinc-400">
              Don't have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-green-500 hover:text-green-400"
                onClick={() => navigate("/signup")}
              >
                Sign up
              </Button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
