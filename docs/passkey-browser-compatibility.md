# Passkey Browser Compatibility Guide

## Overview

This document provides information about browser compatibility for WebAuthn passkey authentication in CloudDesk. Passkeys use the Web Authentication API (WebAuthn), which is supported by modern browsers but may not be available in older versions.

## Supported Browsers

### Desktop Browsers

| Browser | Minimum Version | Platform | Notes |
|---------|----------------|----------|-------|
| **Chrome** | 67+ | Windows, macOS, Linux | Full support for platform and security key authenticators |
| **Edge** | 67+ | Windows, macOS | Full support for platform and security key authenticators |
| **Firefox** | 60+ | Windows, macOS, Linux | Full support for platform and security key authenticators |
| **Safari** | 13+ | macOS | Full support for Touch ID and security keys |

### Mobile Browsers

| Browser | Minimum Version | Platform | Notes |
|---------|----------------|----------|-------|
| **Chrome** | 67+ | Android | Supports fingerprint, face unlock, and security keys |
| **Safari** | 13+ | iOS | Supports Face ID, Touch ID, and security keys |
| **Firefox** | 60+ | Android | Supports fingerprint and security keys |

## Platform Authenticator Support

Platform authenticators are built-in biometric sensors on your device:

### Windows
- **Windows Hello** (Windows 10 version 1903+)
  - Fingerprint readers
  - Facial recognition cameras
  - PIN authentication

### macOS
- **Touch ID** (MacBook Pro 2016+, MacBook Air 2018+)
- **Touch ID** (iMac with Magic Keyboard with Touch ID)

### iOS
- **Face ID** (iPhone X and later)
- **Touch ID** (iPhone 5s through iPhone 8, iPad with Home button)

### Android
- **Fingerprint sensors** (Android 7.0+)
- **Face unlock** (Android 10+, device-dependent)
- **Screen lock** (PIN, pattern, password)

## Cross-Platform Authenticator Support

Cross-platform authenticators (security keys) work across all supported browsers:

- **YubiKey** (USB, NFC, Lightning)
- **Google Titan Security Key**
- **Feitian ePass FIDO**
- **Thetis FIDO U2F**
- Any FIDO2/WebAuthn certified security key

## Feature Detection

CloudDesk automatically detects WebAuthn support when you visit the application. If your browser doesn't support passkeys, you'll see a compatibility message and passkey options will be hidden.

### How Detection Works

The application checks for:
1. `window.PublicKeyCredential` API availability
2. `navigator.credentials` API availability
3. Platform authenticator availability (for biometric options)

### What You'll See

**If WebAuthn is supported:**
- Passkey enrollment options on your profile page
- "Sign in with Passkey" button on the login page
- Full passkey management features

**If WebAuthn is NOT supported:**
- A yellow warning message explaining the limitation
- Passkey options are hidden
- Google OAuth remains available as the primary authentication method

## Compatibility Messages

### Profile Page
When WebAuthn is not supported, you'll see:

> ⚠️ **Passkeys Not Available**
> 
> Your browser doesn't support passkey authentication. To use passkeys, please update to the latest version of Chrome, Firefox, Safari, or Edge.

### Login Page
The "Sign in with Passkey" button will show an error if clicked in an unsupported browser:

> Your browser doesn't support passkeys. Please use a modern browser like Chrome, Firefox, Safari, or Edge.

## Troubleshooting

### "Passkeys not supported" message on a supported browser

**Possible causes:**
1. **Outdated browser version** - Update to the latest version
2. **Disabled JavaScript** - Enable JavaScript in browser settings
3. **Private/Incognito mode** - Some browsers restrict WebAuthn in private mode
4. **Browser extensions** - Disable extensions that might interfere with WebAuthn

### Platform authenticator not available

**Possible causes:**
1. **No biometric hardware** - Your device doesn't have a fingerprint reader or facial recognition
2. **Biometrics not set up** - Configure Windows Hello, Touch ID, or device biometrics in system settings
3. **Permissions denied** - Grant browser permission to access biometric sensors

**Solution:** Use a security key instead by clicking "Add Security Key"

### Security key not detected

**Possible causes:**
1. **USB not connected** - Ensure security key is properly inserted
2. **NFC not enabled** - Enable NFC on mobile devices
3. **Browser permissions** - Grant permission when prompted
4. **Security key not FIDO2 certified** - Ensure your key supports FIDO2/WebAuthn

## Updating Your Browser

### Chrome/Edge
1. Click the three-dot menu → Help → About Chrome/Edge
2. Browser will automatically check for updates
3. Restart browser after update

### Firefox
1. Click the hamburger menu → Help → About Firefox
2. Firefox will automatically check for updates
3. Restart browser after update

### Safari
1. Safari updates come with macOS/iOS updates
2. Go to System Preferences → Software Update (macOS)
3. Go to Settings → General → Software Update (iOS)

## Development and Testing

### Local Development
- WebAuthn works on `localhost` without HTTPS
- Use Chrome DevTools Virtual Authenticator for testing
- Firefox Developer Tools also support virtual authenticators

### Production Requirements
- **HTTPS is required** for WebAuthn in production
- The Relying Party ID (RP_ID) must match your domain
- Origin must match the expected domain exactly

## Browser-Specific Notes

### Chrome/Edge
- Best overall WebAuthn support
- Supports Windows Hello, Touch ID, and security keys
- Virtual authenticator available in DevTools

### Firefox
- Strong privacy protections may affect some WebAuthn features
- Excellent security key support
- May prompt for permissions more frequently

### Safari
- Requires macOS 13+ or iOS 13+ for full support
- Touch ID integration is seamless on supported devices
- May have stricter origin validation

### Mobile Browsers
- Android Chrome supports fingerprint and face unlock
- iOS Safari supports Face ID and Touch ID
- Security keys work via NFC on supported devices

## Fallback Authentication

If your browser doesn't support passkeys or you prefer not to use them:

1. **Google OAuth** - Always available as the primary authentication method
2. **Email/Password** - Traditional authentication (if configured)
3. **2FA with passkeys** - Optional, can be disabled in settings

## Security Considerations

### Browser Security
- Keep your browser updated for the latest security patches
- Only use passkeys on trusted devices
- Be cautious of browser extensions that might intercept credentials

### Device Security
- Enable device lock (PIN, password, biometrics)
- Keep your operating system updated
- Use a strong device password/PIN

## Getting Help

If you continue to experience compatibility issues:

1. **Check browser version** - Ensure you meet minimum requirements
2. **Try a different browser** - Test with Chrome, Firefox, or Edge
3. **Update your OS** - Some features require recent OS versions
4. **Contact support** - Provide browser version and error details

## Additional Resources

- [WebAuthn Browser Support (Can I Use)](https://caniuse.com/webauthn)
- [FIDO Alliance - Certified Products](https://fidoalliance.org/certification/fido-certified-products/)
- [W3C WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)
- [MDN Web Docs - Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)

## Version History

- **v1.0** (2024) - Initial passkey implementation with browser compatibility detection
