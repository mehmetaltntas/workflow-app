import { useEffect, useRef, useCallback } from "react";

// Google Identity Services tipi
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfig) => void;
          renderButton: (
            element: HTMLElement,
            options: GoogleButtonOptions
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleIdConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface GoogleButtonOptions {
  theme: "outline" | "filled_blue" | "filled_black";
  size: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  width?: number;
  logo_alignment?: "left" | "center";
}

interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

interface GoogleSignInButtonProps {
  onSuccess: (idToken: string) => void;
  onError?: (error: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
}

const GoogleSignInButton = ({
  onSuccess,
  onError,
  text = "continue_with",
}: GoogleSignInButtonProps) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const handleCredentialResponse = useCallback(
    (response: GoogleCredentialResponse) => {
      if (response.credential) {
        onSuccess(response.credential);
      } else {
        onError?.("Google girisinde hata olustu");
      }
    },
    [onSuccess, onError]
  );

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.warn("VITE_GOOGLE_CLIENT_ID environment variable ayarlanmamis");
      return;
    }

    const initializeGoogle = () => {
      if (
        !window.google ||
        !buttonRef.current ||
        initializedRef.current
      ) {
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          text: text,
          shape: "rectangular",
          width: 320,
          logo_alignment: "left",
        });

        initializedRef.current = true;
      } catch (error) {
        console.error("Google Sign-In baslatma hatasi:", error);
        onError?.("Google Sign-In yuklenemedi");
      }
    };

    // Google SDK yuklendiginde initialize et
    if (window.google) {
      initializeGoogle();
    } else {
      // SDK henuz yuklenmediyse bekle
      const checkGoogleLoaded = setInterval(() => {
        if (window.google) {
          clearInterval(checkGoogleLoaded);
          initializeGoogle();
        }
      }, 100);

      // 5 saniye sonra vazgec
      setTimeout(() => clearInterval(checkGoogleLoaded), 5000);
    }

    return () => {
      initializedRef.current = false;
    };
  }, [handleCredentialResponse, text, onError]);

  return (
    <div
      ref={buttonRef}
      style={{
        display: "flex",
        justifyContent: "center",
        minHeight: "44px",
      }}
    />
  );
};

export default GoogleSignInButton;
