export const prerender = false;

import type { APIRoute } from 'astro';

// Definir interfaces para los tipos
interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  fields: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer: {
    text: string;
  };
}

interface DiscordWebhookPayload {
  content: string;
  embeds: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Obtener los datos del formulario
    const data = await request.json() as ContactFormData;
    const { name, email, subject, message } = data;
    
    // Validación básica
    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({ success: false, message: 'Todos los campos son requeridos' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Obtener la URL del webhook de Discord desde las variables de entorno
    const discordWebhookUrl = import.meta.env.DISCORD_WEBHOOK_URL as string;
    
    if (!discordWebhookUrl) {
      console.error('DISCORD_WEBHOOK_URL no está configurado en las variables de entorno');
      return new Response(JSON.stringify({ success: false, message: 'Error de configuración del servidor' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Formatear el mensaje en Markdown
    const formattedMessage = message
      .replace(/\n/g, '\n> ') // Agregar formato de cita a cada línea
      .trim();
    
    // Fecha formateada
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'full',
      timeStyle: 'medium'
    }).format(now);
    
    // Crear el mensaje para Discord con un formato atractivo usando embeds y Markdown
    const discordPayload: DiscordWebhookPayload = {
      content: '# :envelope: Nuevo mensaje de contacto recibido',
      username: "Rock & Code - Formulario de Contacto",
      embeds: [
        {
          title: `:pushpin: **${subject}**`,
          description: "Se ha recibido un nuevo mensaje a través del formulario de contacto.",
          color: 16724855, // Color rosa (#FF1493 en decimal)
          fields: [
            {
              name: ':bust_in_silhouette: **Nombre**',
              value: `**${name}**`,
              inline: true
            },
            {
              name: ':email: **Email**',
              value: `${email}`,
              inline: true
            },
            {
              name: ':page_facing_up: **Mensaje**',
              value: `> ${formattedMessage}`
            }
          ],
          footer: {
            text: `Rock & Code | ${formattedDate}`
          }
        }
      ]
    };
    
    // Enviar el mensaje al webhook de Discord
    const discordResponse = await fetch(discordWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(discordPayload)
    });
    
    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error('Error al enviar mensaje a Discord:', errorText);
      throw new Error(`Error al enviar mensaje a Discord: ${errorText}`);
    }
    
    // Devolver respuesta exitosa
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Mensaje enviado con éxito'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error en el endpoint de contacto:', errorMessage);
    
    // Devolver respuesta de error
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Error interno del servidor',
      error: errorMessage
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};