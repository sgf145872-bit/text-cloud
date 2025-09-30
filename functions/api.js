export async function onRequest(context) {
    // هذا مثال لدالة API
    if (context.request.url.endsWith('/api/weather')) {
        const mockWeatherData = {
            city: "الرياض",
            temperature: 25,
            description: "مشمس",
            humidity: 40,
            windSpeed: 15
        };
        
        return new Response(JSON.stringify(mockWeatherData), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
    
    // يمكنك إضافة المزيد من الـ endpoints هنا
    return new Response('Not Found', { status: 404 });
}
