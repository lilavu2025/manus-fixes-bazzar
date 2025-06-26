import * as React from "react";
import { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCookie } from "@/utils/cookieUtils";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private getLocalizedText() {
    const language = getCookie("language") || "ar";
    
    const texts = {
      ar: {
        title: "عذراً! حدث خطأ ما",
        description: "نحن آسفون للإزعاج. حدث خطأ غير متوقع.",
        tryAgain: "المحاولة مرة أخرى",
        goHome: "العودة للرئيسية",
        stackTrace: "تفاصيل الخطأ",
      },
      en: {
        title: "Oops! Something went wrong",
        description: "We're sorry for the inconvenience. An unexpected error has occurred.",
        tryAgain: "Try Again",
        goHome: "Go Home",
        stackTrace: "Stack trace",
      },
      he: {
        title: "אופס! משהו השתבש",
        description: "אנו מצטערים על אי הנוחות. אירעה שגיאה בלתי צפויה.",
        tryAgain: "נסה שוב",
        goHome: "חזור לעמוד הבית",
        stackTrace: "מעקב שגיאות",
      },
    };

    return texts[language as keyof typeof texts] || texts.ar;
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      const texts = this.getLocalizedText();
      const language = getCookie("language") || "ar";
      const isRTL = language === "ar" || language === "he";
      
      return (
        <div 
          className={`min-h-screen flex items-center justify-center p-4 bg-gray-50 ${isRTL ? "rtl" : "ltr"}`}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-2xl">
                {texts.title}
              </CardTitle>
              <CardDescription>
                {texts.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-sm font-mono text-red-600 mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="text-xs text-gray-600">
                      <summary className="cursor-pointer font-semibold mb-2">
                        {texts.stackTrace}
                      </summary>
                      <pre className="overflow-auto max-h-40 bg-white p-2 rounded">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className={`flex gap-3 justify-center ${isRTL ? "flex-row-reverse" : "flex-row"}`}>
                <Button onClick={this.handleReset} variant="default">
                  <RefreshCw className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {texts.tryAgain}
                </Button>
                <Button onClick={this.handleGoHome} variant="outline">
                  <Home className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {texts.goHome}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
