import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-indigo-600" />
            <CardTitle className="text-2xl">Document Processor</CardTitle>
            <CardDescription>Convert, translate, and process your documents</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Sign In to Get Started</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-indigo-600" />
            <CardTitle className="text-3xl">Document Processor</CardTitle>
            <CardDescription>Convert, translate, and process your documents with ease</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <Upload className="w-8 h-8 text-indigo-600 mb-2" />
                  <CardTitle className="text-lg">Upload</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Drag and drop or select your PDF, DOCX, or XLSX files</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <FileText className="w-8 h-8 text-indigo-600 mb-2" />
                  <CardTitle className="text-lg">Process</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Extract text, apply OCR, and translate between languages</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <FileText className="w-8 h-8 text-indigo-600 mb-2" />
                  <CardTitle className="text-lg">Download</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Convert to your desired format and download the result</p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center pt-4">
              <Button size="lg" onClick={() => navigate('/processor')}>
                <Upload className="w-4 h-4 mr-2" />
                Start Processing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
