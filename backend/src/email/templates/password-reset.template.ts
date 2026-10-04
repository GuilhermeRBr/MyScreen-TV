/**
 * Template HTML do e-mail de recuperação de senha.
 * Separado da lógica de envio para facilitar manutenção e testes.
 */
export function buildPasswordResetEmailHtml(resetLink: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redefinição de senha</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0f0f0f;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #e5e5e5;
    }
    .wrapper {
      max-width: 520px;
      margin: 40px auto;
      background-color: #1a1a1a;
      border-radius: 12px;
      overflow: hidden;
    }
    .header {
      background-color: #f5c518;
      padding: 24px 32px;
    }
    .header h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: #0f0f0f;
    }
    .body {
      padding: 32px;
    }
    .body p {
      margin: 0 0 16px;
      font-size: 15px;
      line-height: 1.6;
      color: #c5c5c5;
    }
    .btn {
      display: inline-block;
      margin: 8px 0 24px;
      padding: 14px 28px;
      background-color: #f5c518;
      color: #0f0f0f;
      text-decoration: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 700;
    }
    .footer {
      padding: 16px 32px 32px;
      font-size: 13px;
      color: #666;
      border-top: 1px solid #2a2a2a;
    }
    .footer p {
      margin: 0 0 8px;
    }
    .link-fallback {
      word-break: break-all;
      color: #f5c518;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>MyScreen TV</h1>
    </div>
    <div class="body">
      <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
      <p>Clique no botão abaixo para criar uma nova senha. O link expira em <strong>15 minutos</strong>.</p>
      <a href="${resetLink}" class="btn">Redefinir senha</a>
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
