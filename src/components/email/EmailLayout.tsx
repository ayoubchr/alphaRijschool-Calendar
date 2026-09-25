import * as React from "react";

export function EmailLayout({
  preview,
  title,
  intro,
  children,
  action,
  note,
}: {
  preview: string;
  title: string;
  intro: string;
  children?: React.ReactNode;
  action?: { href: string; label: string };
  note?: string;
}) {
  const logo = `${process.env.APP_URL}/logo.png`;
  return (
    <div style={{ minWidth: "100%", margin: 0, padding: 0, backgroundColor: "#F4F4F4" }}>
      <div style={{ display: "none", fontSize: 1, lineHeight: 1, color: "#F4F4F4" }}>{preview}</div>
      <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: "#F4F4F4" }}>
        <tbody>
          <tr>
            <td align="center" style={{ padding: "32px 16px" }}>
              <table cellPadding={0} cellSpacing={0} style={{ width: "480px", maxWidth: "100%", backgroundColor: "#ffffff" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "28px 32px 36px" }}>
                      <img src={logo} alt="Alpha Rijschool" width="120" style={{ display: "block", border: 0, height: "auto", marginBottom: 28 }} />
                      <h1 style={{ margin: "0 0 16px", fontSize: 26, lineHeight: "32px", fontWeight: 800, letterSpacing: "-0.6px", color: "#111827" }}>{title}</h1>
                      <p style={{ margin: "0 0 22px", fontSize: 15, lineHeight: "24px", color: "#333333" }}>{intro}</p>
                      {children}
                      {action && (
                        <table cellPadding={0} cellSpacing={0} style={{ marginTop: 8 }}>
                          <tbody>
                            <tr>
                              <td style={{ backgroundColor: "#ed1c24", borderRadius: 10 }}>
                                <a href={action.href} style={{ display: "inline-block", padding: "12px 22px", color: "#ffffff", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                                  {action.label}
                                </a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      )}
                      {note && (
                        <table cellPadding={0} cellSpacing={0} width="100%" style={{ marginTop: 24 }}>
                          <tbody>
                            <tr>
                              <td style={{ backgroundColor: "#fee2e2", padding: "16px 18px" }}>
                                <p style={{ margin: 0, fontSize: 14, lineHeight: "22px", color: "#DC2626" }}>{note}</p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      )}
                      <p style={{ margin: "28px 0 0", fontSize: 14, lineHeight: "22px", color: "#58595b" }}>Tot binnenkort,<br />Alpha Rijschool</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function EmailRows({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <>
      {rows.map((row) => (
        <div key={row.label}>
          <p style={{ margin: "0 0 2px", fontSize: 13, lineHeight: "20px", fontWeight: 700, color: "#111827" }}>{row.label}</p>
          <p style={{ margin: "0 0 16px", fontSize: 14, lineHeight: "22px", color: "#333333", whiteSpace: "pre-line" }}>{row.value}</p>
        </div>
      ))}
    </>
  );
}
