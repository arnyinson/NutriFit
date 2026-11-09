import ConfirmHcaptcha from "@hcaptcha/react-native-hcaptcha";
import { forwardRef, useImperativeHandle, useRef } from "react";

// Public site key (safe to be in the app). The SECRET is only on the backend.
const SITE_KEY = "141a2f18-91c8-4134-8baa-d7d2bda4d984";

export type CaptchaHandle = { show: () => void };

type Props = {
  onToken: (token: string) => void; // user passed the captcha
  onCancel?: () => void; // user closed the challenge
  onError?: (message: string) => void; // captcha could not load / failed
};

// Invisible hCaptcha: call ref.current.show(); a challenge only appears if needed.
const Captcha = forwardRef<CaptchaHandle, Props>(function Captcha(
  { onToken, onCancel, onError },
  ref,
) {
  const inner = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    show: () => inner.current?.show(),
  }));

  return (
    <ConfirmHcaptcha
      ref={inner}
      siteKey={SITE_KEY}
      baseUrl="https://hcaptcha.com"
      size="invisible"
      languageCode="en"
      onMessage={(event: any) => {
        if (!event) return;
        const data = event.nativeEvent?.data;
        if (data === "challenge-closed" || data === "cancel") {
          inner.current?.hide();
          event.reset?.();
          onCancel?.();
          return;
        }
        if (event.success && data && data.length > 20) {
          event.markUsed?.();
          inner.current?.hide();
          onToken(data);
          return;
        }
        // Anything else is an error code (network, expired, etc.)
        inner.current?.hide();
        event.reset?.();
        onError?.(String(data || "Captcha failed"));
      }}
    />
  );
});

export default Captcha;
