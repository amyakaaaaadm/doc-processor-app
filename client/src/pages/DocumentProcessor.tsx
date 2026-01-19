import React, { useState, useRef } from 'react';
import { Upload, FileText, Download, Settings, Loader2, CheckCircle, X, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';

type Step = 'upload' | 'settings' | 'processing' | 'editor' | 'complete';

interface FileInfo {
  name: string;
  size: string;
  type: string;
  isScan: boolean;
}

interface Settings {
  outputFormat: 'pdf' | 'docx' | 'xlsx';
  translateFrom: string;
  translateTo: string;
  skipTranslation: boolean;
  ocrLanguages: {
    uzb: boolean;
    rus: boolean;
    eng: boolean;
  };
  preserveStructure: boolean;
  translateTiming: 'before' | 'after';
}

const LANGUAGES = {
  uzb: 'Ўзбек',
  rus: 'Русский',
  eng: 'English',
};

const DocumentProcessor: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const [editedText, setEditedText] = useState('');
  const [resultFile, setResultFile] = useState<{ name: string; size: string; format: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<Settings>({
    outputFormat: 'docx',
    translateFrom: 'none',
    translateTo: 'none',
    skipTranslation: true,
    ocrLanguages: {
      uzb: true,
      rus: true,
      eng: true,
    },
    preserveStructure: true,
    translateTiming: 'after',
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Document Processor</CardTitle>
            <CardDescription>Sign in to process your documents</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFileSelect = (selectedFile: File | undefined) => {
    if (!selectedFile) return;

    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    const supportedFormats = ['pdf', 'docx', 'xlsx', 'doc', 'xls'];

    if (!fileExtension || !supportedFormats.includes(fileExtension)) {
      alert('Unsupported file format. Please upload PDF, DOCX, or XLSX files.');
      return;
    }

    setFile(selectedFile);
    const isScan = fileExtension === 'pdf' && Math.random() > 0.5;
    setFileInfo({
      name: selectedFile.name,
      size: (selectedFile.size / (1024 * 1024)).toFixed(2),
      type: fileExtension.toUpperCase(),
      isScan: isScan,
    });

    setStep('settings');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const processDocument = async () => {
    setStep('processing');
    setProcessing(true);
    setProgress(0);

    try {
      // Simulate processing steps
      setProgress(20);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const sampleText = "Sample extracted text from document.\n\nThis is a multi-paragraph document with various sections.\n\nTables and formatting are preserved during conversion.";
      setExtractedText(sampleText);
      setEditedText(sampleText);

      setProgress(50);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProgress(80);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const resultFileName = file?.name.replace(/\.[^/.]+$/, `.${settings.outputFormat}`) || 'result';
      setResultFile({
        name: resultFileName,
        size: ((file?.size || 0) * 0.8 / (1024 * 1024)).toFixed(2),
        format: settings.outputFormat.toUpperCase(),
      });

      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));

      setStep('editor');
      setProcessing(false);
    } catch (error) {
      console.error('Processing error:', error);
      setProcessing(false);
      alert('Error processing document');
    }
  };

  const downloadResult = () => {
    const blob = new Blob([editedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resultFile?.name || 'result.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setStep('complete');
  };

  const resetApp = () => {
    setStep('upload');
    setFile(null);
    setFileInfo(null);
    setExtractedText('');
    setEditedText('');
    setResultFile(null);
    setProgress(0);
    setSettings({
      outputFormat: 'docx',
      translateFrom: 'none',
      translateTo: 'none',
      skipTranslation: true,
      ocrLanguages: { uzb: true, rus: true, eng: true },
      preserveStructure: true,
      translateTiming: 'after',
    });
  };

  // Upload Screen
  if (step === 'upload') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-indigo-600" />
            <CardTitle className="text-3xl">Document Processing Tool</CardTitle>
            <CardDescription>Convert, translate, and process your documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="border-4 border-dashed border-indigo-300 rounded-xl p-12 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-300"
            >
              <Upload className="w-16 h-16 mx-auto mb-4 text-indigo-400" />
              <p className="text-xl font-semibold text-gray-700 mb-2">Drag & Drop file here</p>
              <p className="text-gray-500 mb-4">or click to browse</p>
              <p className="text-sm text-gray-400">Supported: PDF, DOCX, XLSX</p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.xlsx,.doc,.xls"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Settings Screen
  if (step === 'settings') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Processing Settings</CardTitle>
                <CardDescription className="mt-2">
                  File: <span className="font-medium">{fileInfo?.name}</span> ({fileInfo?.size} MB)
                </CardDescription>
                {fileInfo?.isScan && (
                  <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                    <File className="w-4 h-4" /> Scan detected - OCR will be applied
                  </p>
                )}
              </div>
              <button onClick={() => setStep('upload')} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Output Format */}
            <div>
              <Label className="text-sm font-semibold">Output Format</Label>
              <div className="flex gap-4 mt-3">
                {['pdf', 'docx', 'xlsx'].map(format => (
                  <Button
                    key={format}
                    variant={settings.outputFormat === format ? 'default' : 'outline'}
                    onClick={() => setSettings({ ...settings, outputFormat: format as any })}
                    className="flex-1"
                  >
                    {format.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Translation */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Translation</Label>
              <div className="flex items-center gap-4 mb-4">
                <Select value={settings.translateFrom} onValueChange={(value) =>
                  setSettings({
                    ...settings,
                    translateFrom: value,
                    skipTranslation: value === 'none',
                  })
                }>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="From" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Translation</SelectItem>
                    {Object.entries(LANGUAGES).map(([code, name]) => (
                      <SelectItem key={code} value={code}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={settings.translateTo} onValueChange={(value) =>
                  setSettings({ ...settings, translateTo: value })
                }>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="To" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Translation</SelectItem>
                    {Object.entries(LANGUAGES).map(([code, name]) => (
                      <SelectItem key={code} value={code}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* OCR Languages */}
            {fileInfo?.isScan && (
              <div>
                <Label className="text-sm font-semibold mb-3 block">OCR Languages</Label>
                <div className="space-y-2">
                  {Object.entries(LANGUAGES).map(([code, name]) => (
                    <div key={code} className="flex items-center gap-2">
                      <Checkbox
                        id={`lang-${code}`}
                        checked={settings.ocrLanguages[code as keyof typeof settings.ocrLanguages]}
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            ocrLanguages: {
                              ...settings.ocrLanguages,
                              [code]: checked,
                            },
                          })
                        }
                      />
                      <Label htmlFor={`lang-${code}`} className="cursor-pointer">{name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preserve Structure */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="preserve"
                checked={settings.preserveStructure}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, preserveStructure: checked as boolean })
                }
              />
              <Label htmlFor="preserve" className="cursor-pointer">Preserve document structure</Label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={() => setStep('upload')} className="flex-1">
                Back
              </Button>
              <Button onClick={processDocument} className="flex-1">
                <Settings className="w-4 h-4 mr-2" />
                Process Document
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Processing Screen
  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-indigo-600 animate-spin" />
            <CardTitle className="text-2xl">Processing Document</CardTitle>
            <CardDescription>Please wait while we process your document...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>✓ Uploading file</p>
                {progress >= 40 && <p>✓ Extracting text</p>}
                {progress >= 70 && <p>✓ Processing content</p>}
                {progress >= 90 && <p>✓ Converting format</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Editor Screen
  if (step === 'editor') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Edit Extracted Text</CardTitle>
            <CardDescription>Review and edit the extracted content before downloading</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="min-h-96 font-mono text-sm"
              placeholder="Extracted text will appear here..."
            />

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep('settings')} className="flex-1">
                Back
              </Button>
              <Button onClick={downloadResult} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download Result
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Complete Screen
  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
            <CardTitle className="text-2xl">Processing Complete!</CardTitle>
            <CardDescription>Your document has been successfully processed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {resultFile && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium">File: {resultFile.name}</p>
                <p className="text-sm text-gray-600">Size: {resultFile.size} MB</p>
                <p className="text-sm text-gray-600">Format: {resultFile.format}</p>
              </div>
            )}

            <Button onClick={resetApp} className="w-full">
              Process Another Document
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default DocumentProcessor;
