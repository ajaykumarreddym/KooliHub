import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, CheckCircle2, Upload, FileText, Calendar, AlertCircle } from "lucide-react";

export default function VerificationID() {
  const navigate = useNavigate();

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
              Verification & ID
            </h1>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6">
          {/* Status Card */}
          <div className="bg-gradient-to-r from-[#137fec] to-[#0d5fb8] rounded-xl p-6 text-white mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="h-8 w-8" />
              <div>
                <h2 className="text-xl font-bold">Verification Status</h2>
                <Badge className="bg-white/20 text-white mt-1">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Pending Review
                </Badge>
              </div>
            </div>
            <p className="text-sm text-white/90">
              Complete your verification to start earning as a driver
            </p>
          </div>

          {/* Documents List */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Driver's License
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Upload a clear photo of your license
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Address Proof
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Utility bill, bank statement, or ID card
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Background Check
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Automatically verified
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                  Completed
                </Badge>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl p-4">
            <div className="flex gap-3">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Why verify your identity?
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Verification helps build trust with passengers and ensures a safe ride-sharing experience for everyone.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}

