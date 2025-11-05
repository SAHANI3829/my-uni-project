import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <GraduationCap className="mx-auto mb-6 h-16 w-16 text-primary" />
        <h1 className="mb-4 text-4xl font-bold">University Management System</h1>
        <p className="mb-8 text-xl text-muted-foreground">
          Manage courses, students, and assignments efficiently
        </p>
        <Button onClick={() => navigate("/auth")} size="lg">
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default Index;
