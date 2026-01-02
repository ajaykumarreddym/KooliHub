import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, HelpCircle, MessageSquare, Phone, Mail, FileText, ChevronRight } from "lucide-react";

export default function HelpSupport() {
  const navigate = useNavigate();

  const helpTopics = [
    {
      title: "Getting Started",
      description: "Learn how to use the app",
      icon: <HelpCircle className="h-5 w-5" />,
    },
    {
      title: "Booking a Trip",
      description: "How to search and book rides",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Driver Information",
      description: "Become a driver and earn",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Payments & Refunds",
      description: "Billing and payment issues",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Safety & Security",
      description: "Tips for safe ride-sharing",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Account Settings",
      description: "Manage your account",
      icon: <FileText className="h-5 w-5" />,
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Help & Support
            </h1>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6">
          {/* Contact Options */}
          <div className="space-y-2 mb-6">
            <p className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 px-1">
              Contact Us
            </p>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#137fec]/10 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-[#137fec]" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-white">Live Chat</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Chat with our support team
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>

              <a
                href="tel:+1234567890"
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-white">Call Us</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      +1 (234) 567-890
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </a>

              <a
                href="mailto:support@koolihub.com"
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Mail className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-white">Email Us</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      support@koolihub.com
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </a>
            </div>
          </div>

          {/* Help Topics */}
          <div className="space-y-2 mb-6">
            <p className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 px-1">
              Help Topics
            </p>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              {helpTopics.map((topic, index) => (
                <button
                  key={index}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400">
                      {topic.icon}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {topic.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {topic.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              ))}
            </div>
          </div>

          {/* FAQs Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/trip-booking/faq")}
          >
            <FileText className="h-4 w-4 mr-2" />
            View FAQs
          </Button>

          {/* Info */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl p-4">
            <div className="flex gap-3">
              <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  24/7 Support
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Our support team is available round the clock to help you with any issues or questions.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}

