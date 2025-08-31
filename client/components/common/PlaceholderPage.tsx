import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: string;
  comingSoonFeatures: string[];
}

export function PlaceholderPage({ title, description, icon, comingSoonFeatures }: PlaceholderPageProps) {
  return (
    <Layout>
      <div className="py-20">
        <div className="container max-w-4xl mx-auto text-center">
          {/* Back button */}
          <div className="flex justify-start mb-8">
            <Link to="/">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Main content */}
          <div className="mb-12">
            <div className="text-6xl mb-6">{icon}</div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              {title}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {description}
            </p>
          </div>

          {/* Coming soon card */}
          <Card className="mb-12">
            <CardContent className="p-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🚧 Coming Soon!
              </h2>
              <p className="text-gray-600 mb-8">
                We're working hard to bring you this amazing service. Here's what you can expect:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {comingSoonFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-left">
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Want to be notified when this service launches?
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  We'll send you an email as soon as this service becomes available.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary flex-1 max-w-sm"
                  />
                  <Button>
                    Notify Me
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact support */}
          <div className="bg-primary/5 rounded-2xl p-8">
            <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Need this service urgently?
            </h3>
            <p className="text-gray-600 mb-6">
              Contact our support team and we'll help you find alternative solutions.
            </p>
            <Button variant="outline">
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
