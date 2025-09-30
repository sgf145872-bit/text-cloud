// functions/api/weather.js
export async function onRequestGet(context) {
    try {
        const weatherData = {
            city: "الرياض",
            temperature: Math.floor(Math.random() * 15) + 20,
            description: "مشمس",
            humidity: Math.floor(Math.random() * 30) + 40,
            windSpeed: Math.floor(Math.random() * 10) + 5,
            timestamp: new Date().toLocaleString('ar-SA'),
            success: true
        };
        
        return new Response(JSON.stringify(weatherData, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({
            error: 'Internal server error',
            success: false
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// Handle OPTIONS requests for CORS
export async function onRequestOptions(context) {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}
