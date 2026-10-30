/**
 * Políticas en español para pdfeditoronline.net
 * Run with: node scripts/seed-legal.mjs
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const db = await mysql.createConnection(process.env.DATABASE_URL);

const OWNER = `**Alejandro Gutiérrez**, con DNI 48063365N y domicilio en Avinguda Porta Diagonal, Barcelona (España)`;
const SITE = "pdfeditoronline.net";
const MAIL = "support@pdfeditoronline.net";
const BRAND = "PDF Editor Online";

const termsContent = `# Condiciones de uso y de contratación

**Vigentes desde:** 30 de octubre de 2026

> **Quién presta el servicio.** ${SITE} lo opera ${OWNER}. La marca con la que se ofrece el servicio es **${BRAND}**. El correo de atención, incluida la protección de datos, es **${MAIL}**.

Estas condiciones regulan el acceso a ${SITE} y el uso de sus herramientas. Quien entra en el sitio o utiliza una función acepta este texto. Si no está de acuerdo, no debe usar el servicio.

## 1. Qué es el servicio

${BRAND} es un editor de documentos PDF que se usa en el navegador. Permite retocar texto, anotar, firmar, comprimir, proteger con contraseña, reordenar páginas y convertir archivos, sin instalar un programa en el equipo. Hay funciones de consulta y funciones que requieren una cuenta y un plan de pago.

## 2. La cuenta

Para las funciones de pago hace falta una cuenta. Quien la abre es responsable de guardar la contraseña y de lo que se haga desde esa sesión. Si detecta un acceso que no reconoce, debe escribir a ${MAIL} en cuanto pueda.

## 3. Precio, prueba y renovación

### 3.1 Prueba de 24 horas

Lo que se cobra es lo que se muestra en la pantalla de pago. En la fecha de este texto, la prueba dura **24 horas**, cuesta **0,50 EUR** (impuestos incluidos) y, al terminar, pasa a **{price}/mes** hasta que se cancele.

La prueba empieza cuando se confirma el primer pago y termina **24 horas después**. La hora exacta se envía por correo y queda visible en el panel.

Durante la prueba el acceso a las herramientas es el del plan de pago, con un tope de **2 descargas** de documentos distintos. Volver a bajar un archivo ya descargado no consume otro cupo.

### 3.2 Cargo mensual

**Aviso.** Al pagar los 0,50 EUR, la persona usuaria **autoriza** un cargo de **{price}/mes** (impuestos incluidos) en la misma tarjeta cuando acaben las 24 horas. Ese cargo se repite cada mes hasta que cancele.

Si cancela antes de que acabe la prueba, no se genera el cargo mensual.

### 3.3 Cómo cancelar

La baja se hace en el panel, en [pdfeditoronline.net/dashboard](https://pdfeditoronline.net/dashboard), sección **Facturación**, botón **Cancelar suscripción**. También se puede pedir por correo a ${MAIL} indicando el email de la cuenta.

Si la baja llega después de iniciado un mes ya cobrado, el acceso sigue hasta el final de ese periodo. No hay penalización por cancelar.

### 3.4 Desistimiento y devolución

Hay **14 días naturales** desde la contratación para desistir y recuperar el dinero, sin explicar el motivo y sin coste.

${BRAND} mantiene ese derecho **aunque el servicio digital ya haya empezado**, y no aplica la excepción que la norma de consumo permitiría en ese caso (Directiva 2011/83/UE y Real Decreto Legislativo 1/2007). Haber usado el editor durante la prueba no quita el derecho a desistir dentro de esos 14 días.

Basta pedirlo en el panel o escribir a ${MAIL} con el correo de la cuenta. La devolución se hace por el mismo medio de pago, en un máximo de 14 días naturales desde que llega la petición.

### 3.5 Cambios de precio

Los importes están en euros e incluyen el IVA que corresponda. Un cambio de tarifa se avisa por correo con al menos 30 días y solo afecta a periodos que todavía no se han cobrado.

## 4. Uso que no se admite

No está permitido:

- Subir contenido ilícito o que lesione derechos de otras personas.
- Entrar en cuentas ajenas o en la infraestructura del sitio.
- Usar el servicio para malware, spam o fraude.
- Intentar extraer el código o eludir las medidas de acceso.
- Automatizar el sitio (robots, extracción masiva) sin permiso escrito.

La cuenta que incumpla esto puede suspenderse.

## 5. Propiedad

El diseño, el código, el logotipo y los textos del sitio pertenecen a su titular. Los archivos que sube cada persona siguen siendo suyos. El servicio no se queda con derechos sobre esos documentos.

## 6. Archivos

Los PDF se tratan para prestar la función pedida. No se leen para otros fines ni se ceden. Los temporales se borran al acabar el proceso. Lo que se guarda en la cuenta permanece mientras la suscripción esté vigente y, tras la baja, durante un plazo breve de gracia indicado en el panel.

## 7. Responsabilidad

El servicio se ofrece según disponibilidad. No se promete una continuidad sin interrupciones ni que el resultado encaje con cada caso concreto. Dentro de lo que permite la ley, no se responden daños indirectos o consecuenciales. La responsabilidad total no superará lo pagado por esa cuenta en los 12 meses anteriores al hecho.

## 8. Cambios de estas condiciones

Las versiones nuevas se publican en esta página. Un cambio importante se avisa por correo a las cuentas registradas con al menos 15 días. Seguir usando el sitio después de ese plazo supone aceptar el texto nuevo.

## 9. Ley y tribunales

Se aplica la normativa española y la de la Unión Europea. Si quien contrata es consumidor, los tribunales competentes son los de su domicilio. La plataforma europea de litigios en línea está en [ec.europa.eu/consumers/odr](https://ec.europa.eu/consumers/odr).

## 10. Contacto

${MAIL} o el formulario de [pdfeditoronline.net/contact](https://pdfeditoronline.net/contact).`;

const privacyContent = `# Política de privacidad

**Vigente desde:** 30 de octubre de 2026

> **Responsable.** ${OWNER}. Opera ${SITE} bajo la marca **${BRAND}**. Para ejercer derechos: **${MAIL}**.

Esta política explica qué datos se recogen al usar el editor, para qué, durante cuánto tiempo y cómo pedir acceso, rectificación o supresión.

## 1. Responsable

- **Nombre:** Alejandro Gutiérrez
- **DNI:** 48063365N
- **Domicilio:** Avinguda Porta Diagonal, Barcelona (España)
- **Sitio y marca:** ${BRAND} (${SITE})
- **Correo:** ${MAIL}
- **Formulario:** [pdfeditoronline.net/contact](https://pdfeditoronline.net/contact)

## 2. Qué datos se tratan

### Datos que facilita la persona

- Alta: nombre, correo y credenciales.
- Pago: la referencia de la operación. El número completo de tarjeta lo trata **Sipay** (proveedor de pago). Este sitio no guarda el PAN ni el CVV.
- Mensajes enviados por el formulario o por correo.

### Datos técnicos

- Páginas vistas, herramienta usada y duración de la sesión.
- IP, navegador, sistema e idioma.
- Cookies, según la [política de cookies](/es/cookies).

### Documentos

Los PDF se procesan para la función solicitada. No se analizan para publicidad ni para entrenar modelos.

## 3. Base jurídica

- Ejecución del contrato (art. 6.1.b RGPD): cuenta, editor y cobros.
- Consentimiento (art. 6.1.a): cookies no necesarias y avisos comerciales, si se aceptan.
- Interés legítimo (art. 6.1.f): seguridad, prevención de fraude y mejora del sitio.
- Obligación legal (art. 6.1.c): conservación fiscal.

## 4. Para qué se usan

- Abrir y mantener la cuenta.
- Cobrar la prueba y la cuota mensual.
- Enviar avisos del servicio: pago, baja, seguridad.
- Atender consultas.
- Medir el uso agregado del sitio.
- Cumplir obligaciones contables.

No se elaboran perfiles para vender datos a terceros.

## 5. Encargados

- **Sipay**, para el cobro (España / UE).
- Alojamiento y correo transaccional, en la UE o con garantías si el proveedor está fuera.
- Medición de audiencia (Google Analytics), si la cookie correspondiente está aceptada.

No se venden listas de correos.

## 6. Transferencias fuera del EEE

Si un proveedor está fuera del Espacio Económico Europeo, la transferencia se apoya en una decisión de adecuación o en cláusulas tipo de la Comisión Europea.

## 7. Plazos

- Cuenta: mientras esté abierta y 30 días después de pedir la supresión, salvo bloqueo legal.
- Facturación: el plazo fiscal, en general 5 años.
- Documentos temporales: se eliminan al terminar el proceso.
- Documentos guardados en la cuenta: mientras haya suscripción y un plazo corto posterior.
- Analítica: como máximo 26 meses.

## 8. Derechos

Acceso, rectificación, supresión, limitación, portabilidad, oposición y retirada del consentimiento. La petición se envía a ${MAIL}. Se responde en un máximo de 30 días. También se puede reclamar ante la Agencia Española de Protección de Datos ([www.aepd.es](https://www.aepd.es)).

## 9. Seguridad

Conexión cifrada (TLS), acceso restringido a los sistemas y borrado de temporales. Ninguna medida elimina el riesgo por completo.

## 10. Menores

El servicio no está dirigido a menores de 16 años. Si se detecta una cuenta de un menor sin autorización de quien ejerce la patria potestad, se elimina.

## 11. Cambios

Si esta política cambia de forma relevante, se publica aquí la fecha nueva y se avisa por correo a las cuentas registradas.

## 12. Contacto

${MAIL}.`;

const cookiesContent = `# Política de cookies

**Vigente desde:** 30 de octubre de 2026

> **Titular.** ${OWNER}. Sitio: ${SITE}. Marca: **${BRAND}**. Correo: **${MAIL}**.

${SITE} usa cookies propias y de terceros para mantener la sesión, recordar el idioma y, si se acepta, medir visitas.

## 1. Qué es una cookie

Es un archivo pequeño que el sitio deja en el navegador. Sirve para reconocer la sesión o una preferencia durante un tiempo.

## 2. Qué cookies se usan

### Necesarias

No se pueden desactivar sin romper el acceso.

- **session_token:** mantiene la sesión.
- **csrf_token:** protege los formularios.
- **cookie_consent:** guarda la elección del banner (12 meses).

### Analítica

Solo si se aceptan.

- **_ga** y **_ga_***: Google Analytics, hasta 24 meses.

### Preferencias

- **lang:** idioma elegido (12 meses).
- **theme:** claro u oscuro, si se ha elegido (12 meses).

### Terceros en el pago

**Sipay** puede instalar cookies propias durante el cobro. Su información está en [sipay.es](https://www.sipay.es).

## 3. Cómo gestionarlas

En el navegador: Chrome, Firefox, Safari y Edge permiten ver, bloquear y borrar cookies. Bloquear las necesarias impide iniciar sesión.

Para la analítica de Google existe el [complemento de inhabilitación](https://tools.google.com/dlpage/gaoptout).

## 4. Base jurídica

Las cookies necesarias se apoyan en el interés legítimo de prestar el servicio (art. 22.2 LSSI, exentas de consentimiento). El resto requiere el consentimiento del banner (art. 6.1.a RGPD).

## 5. Cambios

Si cambia el listado, se actualiza esta página.

## 6. Contacto

${MAIL}.`;

const legalContent = `# Aviso legal

**Vigente desde:** 30 de octubre de 2026

## 1. Titular (art. 10 LSSI-CE)

- **Nombre:** Alejandro Gutiérrez
- **DNI:** 48063365N
- **Domicilio:** Avinguda Porta Diagonal, Barcelona (España)
- **Sitio:** [pdfeditoronline.net](https://pdfeditoronline.net)
- **Marca del servicio:** ${BRAND}
- **Correo:** ${MAIL}
- **Formulario:** [pdfeditoronline.net/contact](https://pdfeditoronline.net/contact)

## 2. Actividad

El sitio ofrece herramientas para editar, firmar, organizar y convertir PDF en el navegador.

## 3. Propiedad intelectual

Los textos, el diseño, el logotipo y el código son del titular, salvo indicación distinta. No se pueden copiar para otro servicio. Los documentos de cada usuario no forman parte de esa titularidad.

## 4. Uso del sitio

No se debe usar el sitio para actividades ilícitas, para dañar los sistemas o para introducir malware.

## 5. Disponibilidad

Puede haber cortes por mantenimiento o por incidencias. Se corrigen cuando es posible, sin que eso genere un derecho automático a indemnización más allá de lo previsto en las condiciones de contratación.

## 6. Enlaces

Los enlaces a otros sitios se ofrecen como referencia. Su contenido lo controla quien los publica.

## 7. Baja de acceso

El acceso puede retirarse a quien incumpla estas normas o las condiciones de contratación.

## 8. Ley aplicable

Normativa española y de la Unión Europea. Si la persona es consumidora, los juzgados de su domicilio. Resolución de litigios en línea: [ec.europa.eu/consumers/odr](https://ec.europa.eu/consumers/odr).`;

const gdprContent = `# Protección de datos (RGPD y LOPDGDD)

**Vigente desde:** 30 de octubre de 2026

> **Responsable.** ${OWNER}. Correo para derechos: **${MAIL}**.

${BRAND} (${SITE}) trata datos personales conforme al Reglamento (UE) 2016/679 y a la Ley Orgánica 3/2018.

## 1. Criterios

- Licitud y transparencia: la finalidad se explica en la política de privacidad.
- Limitación: no se usan los datos para fines incompatibles.
- Minimización: se piden los datos que hacen falta para la cuenta, el pago y el soporte.
- Exactitud: se pueden corregir desde el panel o por correo.
- Conservación limitada: los plazos están en la política de privacidad.
- Seguridad: cifrado en tránsito y acceso restringido.

## 2. Derechos

- Acceso (art. 15).
- Rectificación (art. 16).
- Supresión (art. 17).
- Limitación (art. 18).
- Portabilidad (art. 20).
- Oposición (art. 21).
- No ser objeto de una decisión basada solo en un tratamiento automatizado que produzca efectos jurídicos (art. 22). El cobro recurrente no es una decisión de ese tipo: es la ejecución del contrato que se acepta al pagar.

La solicitud se envía a ${MAIL}. Se puede pedir un dato que confirme la identidad. El plazo de respuesta es de 30 días, prorrogables cuando la norma lo permite. Si la respuesta no convence, cabe reclamación ante la AEPD ([www.aepd.es](https://www.aepd.es)).

## 3. Medidas

- TLS en las comunicaciones.
- Pagos a través de Sipay, sujeto a PCI DSS. El sitio no almacena el número completo de la tarjeta.
- Borrado de archivos temporales al terminar el proceso.
- Copias de seguridad del sistema, no de los PDF temporales una vez eliminados.

## 4. Encargados y transferencias

Los proveedores que tratan datos por cuenta del responsable están sujetos a un encargo o a condiciones equivalentes. Si hay una transferencia fuera del EEE, se usa una decisión de adecuación o cláusulas tipo.

## 5. Brechas

Si una brecha supone un riesgo para los derechos de las personas, se comunica a la autoridad de control en el plazo del art. 33 RGPD y, cuando el riesgo es alto, también a las personas afectadas (art. 34).

## 6. Registro

Las actividades de tratamiento se documentan conforme al art. 30 RGPD.

## 7. Contacto

${MAIL}.`;

const refundContent = `# Devoluciones

**Vigente desde:** 30 de octubre de 2026

> **Titular.** ${OWNER}. Correo: **${MAIL}**.

## 1. Plazo

Hay **14 días naturales** desde la contratación para desistir y recuperar lo pagado, tanto los 0,50 EUR de la prueba como la primera cuota mensual si esa cuota se cargó dentro de esos 14 días.

El derecho se mantiene **aunque ya se haya usado el editor**. No se exige un motivo.

## 2. Cómo pedirlo

Desde el panel, o por correo a ${MAIL} con:

- el asunto «Devolución»;
- el correo de la cuenta;
- si se quiere, el motivo (no es obligatorio).

## 3. Cómo se abona

La devolución se ordena por el mismo medio de pago. El plazo máximo es de 14 días naturales desde la solicitud. El banco puede tardar unos días más en mostrarla.

## 4. Qué ocurre con la cuenta

- La suscripción queda cancelada.
- El acceso de pago termina.
- Los archivos guardados siguen disponibles 30 días para descargarlos y después se borran.
- La cuenta puede volver a activarse más adelante.

## 5. Cuotas posteriores

Una cuota mensual cobrada **después** de esos 14 días no entra en el desistimiento, salvo error de cobro. Para evitar el siguiente cargo hay que cancelar antes de la renovación, en Facturación.

## 6. Contacto

${MAIL} · [pdfeditoronline.net](https://pdfeditoronline.net).`;

const pages = [
  { slug: "terms", title: "Condiciones de uso y de contratación", content: termsContent },
  { slug: "privacy", title: "Política de privacidad", content: privacyContent },
  { slug: "cookies", title: "Política de cookies", content: cookiesContent },
  { slug: "legal", title: "Aviso legal", content: legalContent },
  { slug: "gdpr", title: "Protección de datos", content: gdprContent },
  { slug: "refund", title: "Devoluciones", content: refundContent },
];

try {
  for (const page of pages) {
    const [rows] = await db.execute("SELECT id FROM legal_pages WHERE slug = ?", [page.slug]);
    if (rows.length > 0) {
      await db.execute(
        "UPDATE legal_pages SET title = ?, content = ?, updatedAt = NOW() WHERE slug = ?",
        [page.title, page.content, page.slug]
      );
      console.log(`Updated: ${page.slug}`);
    } else {
      await db.execute(
        "INSERT INTO legal_pages (slug, title, content) VALUES (?, ?, ?)",
        [page.slug, page.title, page.content]
      );
      console.log(`Inserted: ${page.slug}`);
    }
  }
  console.log("\nLegal pages updated.");
} catch (err) {
  console.error("Error:", err.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
