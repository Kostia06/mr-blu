<script lang="ts">
	import { APP_NAME, COMPANY_EMAIL, LAST_UPDATED } from '$lib/constants/legal';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
</script>

<svelte:head>
	<title>Política de Privacidad | {APP_NAME}</title>
	<meta name="description" content="Política de Privacidad de Mr. Blu" />
</svelte:head>

<div class="legal-page">
	<a href="/" class="back-link">
		<ArrowLeft size={16} strokeWidth={2} />
		<span>Inicio</span>
	</a>

	<h1>Política de Privacidad</h1>
	<p class="updated">Última actualización: {LAST_UPDATED}</p>

	<section>
		<h2>1. Información que Recopilamos</h2>

		<h3>Información de cuenta:</h3>
		<ul>
			<li>Email</li>
			<li>Nombre</li>
			<li>Información de negocio (nombre, dirección, teléfono)</li>
		</ul>

		<h3>Información de clientes:</h3>
		<ul>
			<li>Nombres de clientes</li>
			<li>Emails y teléfonos</li>
			<li>Direcciones</li>
		</ul>

		<h3>Documentos:</h3>
		<ul>
			<li>Facturas y presupuestos</li>
			<li>Líneas de artículos y montos</li>
			<li>Notas y términos</li>
		</ul>

		<h3>Datos de voz:</h3>
		<ul>
			<li>Grabaciones de audio para transcripción</li>
			<li>Las grabaciones se procesan y no se almacenan permanentemente</li>
		</ul>

		<h3>Datos de uso:</h3>
		<ul>
			<li>Páginas visitadas</li>
			<li>Acciones realizadas</li>
			<li>Información del dispositivo</li>
			<li>Dirección IP</li>
		</ul>
	</section>

	<section>
		<h2>2. Cómo Usamos tu Información</h2>
		<ul>
			<li>Proporcionar y mejorar el servicio</li>
			<li>Procesar voz y crear documentos</li>
			<li>Enviar emails transaccionales</li>
			<li>Comunicarnos contigo sobre tu cuenta</li>
			<li>Detectar y prevenir fraude</li>
			<li>Cumplir obligaciones legales</li>
		</ul>
	</section>

	<section>
		<h2>3. Servicios de Terceros</h2>
		<p>Usamos los siguientes servicios que pueden procesar tus datos:</p>

		<h3>Supabase</h3>
		<p>Base de datos y autenticación. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">Política de privacidad</a></p>

		<h3>Deepgram</h3>
		<p>Transcripción de voz. <a href="https://deepgram.com/privacy" target="_blank" rel="noopener noreferrer">Política de privacidad</a></p>

		<h3>Google Gemini</h3>
		<p>Procesamiento de texto con IA. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Política de privacidad</a></p>

		<h3>Resend</h3>
		<p>Envío de emails. <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer">Política de privacidad</a></p>

		<h3>Cloudflare</h3>
		<p>Hosting y seguridad. <a href="https://cloudflare.com/privacy" target="_blank" rel="noopener noreferrer">Política de privacidad</a></p>
	</section>

	<section>
		<h2>4. Almacenamiento y Seguridad</h2>
		<p>Tus datos se almacenan en servidores seguros. Implementamos medidas de seguridad incluyendo:</p>
		<ul>
			<li>Encriptación en tránsito (HTTPS)</li>
			<li>Encriptación en reposo</li>
			<li>Autenticación segura</li>
			<li>Acceso limitado a datos</li>
		</ul>
	</section>

	<section>
		<h2>5. Retención de Datos</h2>
		<ul>
			<li>Datos de cuenta: mientras tu cuenta esté activa</li>
			<li>Documentos: hasta que los elimines o cierres tu cuenta</li>
			<li>Grabaciones de voz: eliminadas después del procesamiento</li>
			<li>Logs de errores: 90 días</li>
		</ul>
	</section>

	<section>
		<h2>6. Tus Derechos</h2>
		<p>Tienes derecho a:</p>
		<ul>
			<li><strong>Acceder</strong> a tus datos personales</li>
			<li><strong>Corregir</strong> información inexacta</li>
			<li><strong>Eliminar</strong> tu cuenta y datos</li>
			<li><strong>Exportar</strong> tus datos</li>
			<li><strong>Retirar</strong> consentimiento</li>
		</ul>
		<p>Para ejercer estos derechos, contáctanos.</p>
	</section>

	<section>
		<h2>7. Cookies</h2>
		<p>Usamos cookies esenciales para:</p>
		<ul>
			<li>Mantener tu sesión activa</li>
			<li>Recordar preferencias</li>
		</ul>
		<p>No usamos cookies de seguimiento o publicidad.</p>
	</section>

	<section>
		<h2>8. Menores de Edad</h2>
		<p>Mr. Blu no está dirigido a menores de 18 años. No recopilamos intencionalmente datos de menores.</p>
	</section>

	<section>
		<h2>9. Cambios a esta Política</h2>
		<p>Podemos actualizar esta política. Te notificaremos de cambios significativos por email.</p>
	</section>

	<section>
		<h2>10. Contacto</h2>
		<p>Para preguntas sobre privacidad:</p>
		<p>Email: <a href="mailto:{COMPANY_EMAIL}">{COMPANY_EMAIL}</a></p>
	</section>
</div>

<style>
	.legal-page {
		max-width: 720px;
		margin: 0 auto;
		padding: 40px 20px 80px;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 14px;
		font-weight: 500;
		color: var(--gray-500, #64748b);
		text-decoration: none;
		margin-bottom: 24px;
		transition: color 0.2s ease;
	}

	.back-link:hover {
		color: var(--blu-primary, #0066ff);
	}

	h1 {
		font-size: 32px;
		font-weight: 700;
		margin: 0 0 8px;
		color: var(--gray-900, #0f172a);
	}

	.updated {
		color: var(--gray-500, #64748b);
		font-size: 14px;
		margin: 0 0 32px;
	}

	section {
		margin-bottom: 32px;
	}

	h2 {
		font-size: 20px;
		font-weight: 600;
		margin: 0 0 12px;
		color: var(--gray-900, #1f2937);
	}

	h3 {
		font-size: 16px;
		font-weight: 600;
		margin: 16px 0 8px;
		color: var(--gray-700, #374151);
	}

	p {
		font-size: 15px;
		line-height: 1.7;
		color: var(--gray-600, #4b5563);
		margin: 0 0 12px;
	}

	ul {
		margin: 8px 0 16px 20px;
		padding: 0;
	}

	li {
		font-size: 15px;
		line-height: 1.6;
		color: var(--gray-600, #4b5563);
		margin-bottom: 4px;
	}

	a {
		color: var(--blu-primary, #0066ff);
		text-decoration: underline;
	}
</style>
