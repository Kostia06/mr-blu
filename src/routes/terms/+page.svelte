<script lang="ts">
	import { APP_NAME, COMPANY_EMAIL, LAST_UPDATED } from '$lib/constants/legal';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
</script>

<svelte:head>
	<title>Términos de Servicio | {APP_NAME}</title>
	<meta name="description" content="Términos de Servicio de Mr. Blu" />
</svelte:head>

<div class="legal-page">
	<a href="/" class="back-link">
		<ArrowLeft size={16} strokeWidth={2} />
		<span>Inicio</span>
	</a>

	<h1>Términos de Servicio</h1>
	<p class="updated">Última actualización: {LAST_UPDATED}</p>

	<section>
		<h2>1. Aceptación de Términos</h2>
		<p>Al acceder o usar Mr. Blu, aceptas estos términos. Si no estás de acuerdo, no uses el servicio.</p>
	</section>

	<section>
		<h2>2. Descripción del Servicio</h2>
		<p>Mr. Blu es una plataforma para crear, enviar y gestionar facturas y presupuestos mediante voz y texto. El servicio incluye:</p>
		<ul>
			<li>Creación de facturas y presupuestos</li>
			<li>Transcripción de voz a texto</li>
			<li>Generación de PDFs</li>
			<li>Envío de documentos por email</li>
			<li>Gestión de clientes</li>
		</ul>
	</section>

	<section>
		<h2>3. Cuentas de Usuario</h2>
		<p>Eres responsable de:</p>
		<ul>
			<li>Mantener la seguridad de tu cuenta</li>
			<li>Toda actividad bajo tu cuenta</li>
			<li>Proporcionar información precisa</li>
			<li>Notificarnos de uso no autorizado</li>
		</ul>
	</section>

	<section>
		<h2>4. Uso Aceptable</h2>
		<p>No puedes usar Mr. Blu para:</p>
		<ul>
			<li>Actividades ilegales o fraudulentas</li>
			<li>Enviar spam o contenido no solicitado</li>
			<li>Violar derechos de terceros</li>
			<li>Intentar acceder a sistemas sin autorización</li>
			<li>Crear facturas falsas o engañosas</li>
		</ul>
	</section>

	<section>
		<h2>5. Datos y Contenido</h2>
		<p>Tú eres dueño de tus datos (facturas, clientes, etc.). Nos otorgas licencia para procesar estos datos únicamente para proporcionar el servicio.</p>
		<p>Podemos eliminar contenido que viole estos términos.</p>
	</section>

	<section>
		<h2>6. Pagos y Facturación</h2>
		<p>Algunos servicios pueden requerir pago. Los precios se mostrarán antes de cualquier cargo. Los pagos no son reembolsables excepto donde la ley lo requiera.</p>
	</section>

	<section>
		<h2>7. Disponibilidad del Servicio</h2>
		<p>Nos esforzamos por mantener el servicio disponible, pero no garantizamos disponibilidad 100%. Podemos modificar o descontinuar funciones con aviso razonable.</p>
	</section>

	<section>
		<h2>8. Limitación de Responsabilidad</h2>
		<p>Mr. Blu se proporciona "tal cual". No somos responsables por:</p>
		<ul>
			<li>Pérdidas indirectas o consecuentes</li>
			<li>Pérdida de datos o ganancias</li>
			<li>Interrupciones del servicio</li>
			<li>Errores en transcripciones de voz</li>
		</ul>
		<p>Nuestra responsabilidad máxima se limita al monto pagado en los últimos 12 meses.</p>
	</section>

	<section>
		<h2>9. Terminación</h2>
		<p>Puedes cancelar tu cuenta en cualquier momento. Podemos suspender o terminar cuentas que violen estos términos. Al terminar, tus datos serán eliminados según nuestra política de privacidad.</p>
	</section>

	<section>
		<h2>10. Cambios a los Términos</h2>
		<p>Podemos actualizar estos términos. Te notificaremos de cambios significativos por email o en la app. El uso continuado significa aceptación.</p>
	</section>

	<section>
		<h2>11. Contacto</h2>
		<p>Para preguntas sobre estos términos:</p>
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
