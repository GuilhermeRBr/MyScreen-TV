/**
 * Template HTML do e-mail de recuperação de senha.
 * Separado da lógica de envio para facilitar manutenção e testes.
 *
 * Cores baseadas nos tokens de design do sistema (globals.css):
 *   --color-bg-primary:   #0f0f0f
 *   --color-bg-secondary: #1a1a1a
 *   --color-accent:       #eb5757
 *   --color-accent-hover: #c0392b
 *   --color-border:       #2a2a2a
 *   --color-text-primary: #ffffff
 *   --color-text-secondary: #a0a0a0
 */
export function buildPasswordResetEmailHtml(resetLink: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redefinição de senha — MyScreen TV</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0f0f0f;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #ffffff;
    }
    .wrapper {
      max-width: 520px;
      margin: 40px auto;
      background-color: #1a1a1a;
      border-radius: 12px;
      overflow: hidden;
    }
    .header {
      background-color: #1a1a1a;
      padding: 28px 32px 20px;
      border-bottom: 1px solid #2a2a2a;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-brand {
      display: inline-flex;
      align-items: center;
      gap: 12px;
    }
    .header-title {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.3px;
    }
    .header-title span {
      color: #eb5757;
    }
    .body {
      padding: 32px;
    }
    .body p {
      margin: 0 0 16px;
      font-size: 15px;
      line-height: 1.6;
      color: #a0a0a0;
    }
    .body p strong {
      color: #ffffff;
    }
    .btn {
      display: inline-block;
      margin: 8px 0 28px;
      padding: 14px 32px;
      background-color: #eb5757;
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 700;
    }
    .divider {
      border: none;
      border-top: 1px solid #2a2a2a;
      margin: 0 0 20px;
    }
    .footer {
      padding: 20px 32px 28px;
      font-size: 13px;
      color: #606060;
      border-top: 1px solid #2a2a2a;
    }
    .footer p {
      margin: 0 0 8px;
    }
    .link-fallback {
      word-break: break-all;
      color: #eb5757;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <span class="header-brand">
        <!-- Logo MyScreen TV — ícone SVG inline -->
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 85 88" aria-hidden="true">
          <defs>
            <linearGradient id="email-logo-grad" x1="0" y1="0" x2="87.9471" y2="84.9489" gradientUnits="userSpaceOnUse">
              <stop stop-color="#EB5757"/>
              <stop offset="1" stop-color="#C0392B"/>
            </linearGradient>
          </defs>
          <path d="M9.70996 2.85057C15.7341 -0.763892 23.2134 -0.953477 29.4121 2.35253L74.4121 26.3525C80.9293 29.8284 85 36.6138 85 44C85 51.3862 80.9293 58.1716 74.4121 61.6474L29.4121 85.6474C23.2134 88.9535 15.7341 88.7639 9.70996 85.1494C3.68602 81.5349 0 75.0251 0 68V20C0 12.9748 3.68602 6.46507 9.70996 2.85057Z" fill="url(#email-logo-grad)"/>
          <path d="M24 25V62L59 43.5L24 25Z" fill="#111426" stroke="#111426" stroke-width="8" stroke-linejoin="round"/>
        </svg>
        <h1 class="header-title">MyScreen <span>TV</span></h1>
      </span>
    </div>
    <div class="body">
      <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
      <p>Clique no botão abaixo para criar uma nova senha. O link expira em <strong>15 minutos</strong>.</p>
      <a href="${resetLink}" class="btn">Redefinir senha</a>
      <hr class="divider" />
      <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
      <p class="link-fallback">${resetLink}</p>
    </div>
    <div class="footer">
      <p>Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanece a mesma.</p>
      <p>Por segurança, nunca compartilhe este link com ninguém.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
