import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
  href: string;
  className?: string;
}

export function ServiceCard({ 
  id, 
  title, 
  description, 
  icon, 
  color, 
  features, 
  href,
  className 
}: ServiceCardProps) {
  return (
    <Card className={cn("group hover:shadow-lg transition-all duration-300 overflow-hidden", className)}>
      <CardContent className="p-0">
        {/* Header with gradient background */}
        <div className={cn("bg-gradient-to-br p-6 text-white", color)}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{icon}</span>
            <h3 className="text-xl font-bold">{title}</h3>
          </div>
          <p className="text-white/90 text-sm">{description}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Features */}
          <div className="flex flex-wrap gap-2 mb-4">
            {features.map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>

          {/* CTA Button */}
          <Link to={href}>
            <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
