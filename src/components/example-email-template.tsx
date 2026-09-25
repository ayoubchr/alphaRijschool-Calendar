import * as React from 'react';

interface EmailTemplateProps {
    name: string,
    level: string,
    classtype: string,
    paymentAmount: string,
    street: string,
    housenumber: string,
    postalcode: string,
    city: string,
    phone_1: string,
    phone_2: string
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ name, level, classtype, paymentAmount, street, housenumber, postalcode, city, phone_1, phone_2 }) => {
    return (
        <div style={{ minWidth: '100%', margin: '0px', padding: '0px', backgroundColor: '#F4F4F4' }}>
            <div className="t64" style={{ backgroundColor: '#F4F4F4' }}>
                <table width="100%" cellPadding="0" cellSpacing="0" border={0} align="center">
                    <tr>
                        <td className="t63" style={{ fontSize: 0, lineHeight: 0, backgroundColor: '#F4F4F4' }} valign="top" align="center">
                            <table width="100%" cellPadding="0" cellSpacing="0" border={0} align="center" id="innerTable">
                                <tr>
                                    <td>
                                        <div className="t51" style={{ fontSize: '1px', display: 'none' }}>
                                            &nbsp;&nbsp;
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>

                                        <table className="t53" cellPadding="0" cellSpacing="0" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
                                            <tr>
                                                <td className="t52" style={{ backgroundColor: '#fff', width: '420px', padding: '0 30px 40px 30px' }}>
                                                    <table width="100%" cellPadding="0" cellSpacing="0">
                                                        <tr>
                                                            <td>
                                                                <div className="t1" style={{ lineHeight: '25px', fontSize: '1px', display: 'block' }}>
                                                                    &nbsp;&nbsp;
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <table className="t3" cellPadding="0" cellSpacing="0" style={{ marginRight: 'auto' }}>
                                                                    <tr>
                                                                        <td className="t2" style={{ width: '88px', padding: '0 20px 40px 0' }}>
                                                                            <div style={{ fontSize: '0px' }}>
                                                                                <img className="t0"
                                                                                    style={{ display: 'block', border: 0, height: 'auto', width: '100%', margin: 0, maxWidth: '100%' }}
                                                                                    width="131" height="53.265625" alt=""
                                                                                    src="https://466c150c-872f-4af9-8fab-12141e7655d2.b-cdn.net/e/90ba1811-2aac-4b5b-bc21-49a827be7280/60efd0ea-0bbc-41bd-9ac5-5da349a96a2b.png" />
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <table className="t6" cellPadding="0" cellSpacing="0" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
                                                                    <tr>
                                                                        <td className="t5" style={{ width: '420px', padding: '0 0 20px 0' }}>
                                                                            <h1 className="t4" style={{ margin: 0, lineHeight: '28px', fontWeight: 800, fontStyle: 'normal', fontSize: '26px', textDecoration: 'none', textTransform: 'none', letterSpacing: '-1.04px', direction: 'ltr', color: '#191919', textAlign: 'left' }}>
                                                                                Bevestiging herinschrijving
                                                                            </h1>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <table className="t9" cellPadding="0" cellSpacing="0" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
                                                                    <tr>
                                                                        <td className="t8" style={{ width: '420px', padding: '0 0 22px 0' }}>
                                                                            <p className="t7" style={{ margin: 0, lineHeight: '22px', fontWeight: 500, fontStyle: 'normal', fontSize: '14px', textDecoration: 'none', textTransform: 'none', letterSpacing: '-0.56px', direction: 'ltr', color: '#333', textAlign: 'left' }}>
                                                                                {name} is heringeschreven voor het volgende schooljaar, hieronder vind je de gegevens nog eens op een rijtje:
                                                                            </p>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <table className="t13" cellPadding="0" cellSpacing="0" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
                                                                    <tr>
                                                                        <td className="t12" style={{ width: '420px' }}>
                                                                            <p className="t11"
                                                                                style={{ margin: 0, lineHeight: '22px', fontWeight: 500, fontStyle: 'normal', fontSize: '14px', textDecoration: 'none', textTransform: 'none', letterSpacing: '-0.56px', direction: 'ltr', color: '#333', textAlign: 'left' }}>
                                                                                <span className="t10" style={{ margin: 0, fontWeight: 'bold' }}>Niveau</span>
                                                                            </p>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <table className="t16" cellPadding="0" cellSpacing="0" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
                                                                    <tr>
                                                                        <td className="t15" style={{ width: '420px', padding: '0 0 22px 0' }}>
                                                                            <p className="t14"
                                                                                style={{ margin: 0, lineHeight: '22px', fontWeight: 500, fontStyle: 'normal', fontSize: '14px', textDecoration: 'none', textTransform: 'none', letterSpacing: '-0.56px', direction: 'ltr', color: '#333', textAlign: 'left' }}>
                                                                                {level}
                                                                            </p>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <table className="t20" cellPadding="0" cellSpacing="0" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
                                                                    <tr>
                                                                        <td className="t19" style={{ width: '420px' }}>
                                                                            <p className="t18"
                                                                                style={{ margin: 0, lineHeight: '22px', fontWeight: 500, fontStyle: 'normal', fontSize: '14px', textDecoration: 'none', textTransform: 'none', letterSpacing: '-0.56px', direction: 'ltr', color: '#333', textAlign: 'left' }}>
                                                                                <span className="t17" style={{ margin: 0, fontWeight: 'bold' }}>Klastype</span>
                                                                            </p>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <table className="t23" cellPadding="0" cellSpacing="0" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
                                                                    <tr>
                                                                        <td className="t22" style={{ width: '420px', padding: '0 0 22px 0' }}>
                                                                            <p className="t21"
                                                                                style={{ margin: 0, lineHeight: '22px', fontWeight: 500, fontStyle: 'normal', fontSize: '14px', textDecoration: 'none', textTransform: 'none', letterSpacing: '-0.56px', direction: 'ltr', color: '#333', textAlign: 'left' }}>
                                                                                {classtype}
                                                                            </p>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <table className="t27" cellPadding="0" cellSpacing="0" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
                                                                    <tr>
                                                                        <td className="t26" style={{ width: '420px' }}>
                                                                            <p className="t25"
                                                                                style={{ margin: 0, lineHeight: '22px', fontWeight: 500, fontStyle: 'normal', fontSize: '14px', textDecoration: 'none', textTransform: 'none', letterSpacing: '-0.56px', direction: 'ltr', color: '#333', textAlign: 'left' }}>
                                                                                <span className="t24" style={{ margin: 0, fontWeight: 'bold' }}>Betaling</span>
                                                                            </p>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <table className="t30" cellPadding="0" cellSpacing="0" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
                                                                    <tr>
                                                                        <td className="t29" style={{ width: '420px', padding: '0 0 22px 0' }}>
                                                                            <p className="t28"
                                                                                style={{ margin: 0, lineHeight: '22px', fontWeight: 500, fontStyle: 'normal', fontSize: '14px', textDecoration: 'none', textTransform: 'none', letterSpacing: '-0.56px', direction: 'ltr', color: '#333', textAlign: 'left' }}>
                                                                                € {paymentAmount}
                                                                            </p>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <table className="t34" cellPadding="0" cellSpacing="0" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
                                                                    <tr>
                                                                        <td className="t33" style={{ width: '420px' }}>
                                                                            <p className="t32"
                                                                                style={{ margin: 0, lineHeight: '22px', fontWeight: 500, fontStyle: 'normal', fontSize: '14px', textDecoration: 'none', textTransform: 'none', letterSpacing: '-0.56px', direction: 'ltr', color: '#333', textAlign: 'left' }}>
                                                                                <span className="t31" style={{ margin: 0, fontWeight: 'bold' }}>Telefoon</span>
                                                                            </p>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <table className="t37" cellPadding="0" cellSpacing="0" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
                                                                    <tr>
                                                                        <td className="t36" style={{ width: '420px' }}>
                                                                            <p className="t35"
                                                                                style={{ margin: 0, lineHeight: '22px', fontWeight: 500, fontStyle: 'normal', fontSize: '14px', textDecoration: 'none', textTransform: 'none', letterSpacing: '-0.56px', direction: 'ltr', color: '#333', textAlign: 'left' }}>
                                                                                {phone_1}
                                                                            </p>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <table className="t40" cellPadding="0" cellSpacing="0" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
                                                                    <tr>
                                                                        <td className="t39" style={{ width: '420px' }}>
                                                                            <p className="t38"
                                                                                style={{ margin: 0, lineHeight: '22px', fontWeight: 500, fontStyle: 'normal', fontSize: '14px', textDecoration: 'none', textTransform: 'none', letterSpacing: '-0.56px', direction: 'ltr', color: '#333', textAlign: 'left' }}>
                                                                                {phone_2}
                                                                            </p>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <div className="t41" style={{ lineHeight: '30px', fontSize: '1px', display: 'block' }}>
                                                                    &nbsp;&nbsp;
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <table className="t34" cellPadding="0" cellSpacing="0" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
                                                                    <tr>
                                                                        <td className="t33" style={{ width: '420px' }}>
                                                                            <p className="t32"
                                                                                style={{ margin: 0, lineHeight: '22px', fontWeight: 500, fontStyle: 'normal', fontSize: '14px', textDecoration: 'none', textTransform: 'none', letterSpacing: '-0.56px', direction: 'ltr', color: '#333', textAlign: 'left' }}>
                                                                                <span className="t31" style={{ margin: 0, fontWeight: 'bold' }}>Woonplaats</span>
                                                                            </p>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <table className="t37" cellPadding="0" cellSpacing="0" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
                                                                    <tr>
                                                                        <td className="t36" style={{ width: '420px' }}>
                                                                            <p className="t35"
                                                                                style={{ margin: 0, lineHeight: '22px', fontWeight: 500, fontStyle: 'normal', fontSize: '14px', textDecoration: 'none', textTransform: 'none', letterSpacing: '-0.56px', direction: 'ltr', color: '#333', textAlign: 'left' }}>
                                                                                {street} {housenumber}
                                                                            </p>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <table className="t40" cellPadding="0" cellSpacing="0" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
                                                                    <tr>
                                                                        <td className="t39" style={{ width: '420px' }}>
                                                                            <p className="t38"
                                                                                style={{ margin: 0, lineHeight: '22px', fontWeight: 500, fontStyle: 'normal', fontSize: '14px', textDecoration: 'none', textTransform: 'none', letterSpacing: '-0.56px', direction: 'ltr', color: '#333', textAlign: 'left' }}>
                                                                                {postalcode} {city}
                                                                            </p>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <div className="t41" style={{ lineHeight: '30px', fontSize: '1px', display: 'block' }}>
                                                                    &nbsp;&nbsp;
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <table className="t50" cellPadding="0" cellSpacing="0" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
                                                                    <tr>
                                                                        <td className="t49"
                                                                            style={{ backgroundColor: '#fee2e2', width: '380px', padding: '20px 20px 20px 20px' }}>
                                                                            <div className="t48"
                                                                                style={{ display: 'inline-table', width: '100%', textAlign: 'left', verticalAlign: 'middle' }}>
                                                                                <div className="t47"
                                                                                    style={{ display: 'inline-table', textAlign: 'initial', verticalAlign: 'inherit', width: '100%', maxWidth: '620px' }}>
                                                                                    <div className="t46"
                                                                                        style={{ padding: '0 10px 0 10px' }}>
                                                                                        <table width="100%" cellPadding="0"
                                                                                            cellSpacing="0" className="t45">
                                                                                            <tr>
                                                                                                <td className="t44">
                                                                                                    <p className="t42" style={{ margin: 0, lineHeight: '22px', fontWeight: 500, fontStyle: 'normal', fontSize: '14px', textDecoration: 'none', textTransform: 'none', letterSpacing: '-0.56px', direction: 'ltr', color: '#DC2626', textAlign: 'left' }}>
                                                                                                        Eventuele voorkeuren voor lestijden kunnen niet gegarandeerd worden!
                                                                                                    </p>
                                                                                                </td>
                                                                                            </tr>
                                                                                        </table>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
    );
}
