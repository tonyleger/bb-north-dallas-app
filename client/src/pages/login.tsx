import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !pin) {
      setLocalError("Please enter both email and PIN");
      return;
    }

    try {
      await login(email, pin);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A2332] to-[#0F1620] flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-lg border-[#76C8DF]/20">
        <CardHeader className="space-y-2">
          <div className="flex justify-center mb-4">
            <svg
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-12 h-12"
              aria-label="Budget Blinds logo"
            >
              {/* Window frame */}
              <rect x="3" y="3" width="34" height="34" rx="4" fill="#1A2332" stroke="#76C8DF" strokeWidth="1.5" />
              {/* Pull cord */}
              <line x1="20" y1="5" x2="20" y2="10" stroke="#76C8DF" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="20" cy="11" r="1.5" fill="#76C8DF" />
              {/* Slats */}
              <rect x="7" y="13" width="26" height="3" rx="1.5" fill="#76C8DF" />
              <rect x="7" y="18" width="26" height="3" rx="1.5" fill="#76C8DF" opacity="0.85" />
              <rect x="7" y="23" width="26" height="3" rx="1.5" fill="#76C8DF" opacity="0.7" />
              <rect x="7" y="28" width="26" height="3" rx="1.5" fill="#76C8DF" opacity="0.55" />
            </svg>
          </div>
          <CardTitle className="text-2xl text-center">Budget Blinds North Dallas</CardTitle>
          <CardDescription className="text-center">Team Operations Portal</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {(localError || error) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{localError || error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="border-[#76C8DF]/30 focus:border-[#76C8DF]"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="pin" className="text-sm font-medium">
                PIN
              </label>
              <Input
                id="pin"
                type="password"
                placeholder="Enter 4-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.slice(0, 4))}
                disabled={isLoading}
                maxLength={4}
                className="border-[#76C8DF]/30 focus:border-[#76C8DF]"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email || !pin}
              className="w-full bg-[#76C8DF] hover:bg-[#5ab3cc] text-[#1A2332] font-semibold"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Log in with your Budget Blinds email and PIN.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
