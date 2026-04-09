from django.http import JsonResponse
from rest_framework import status

def handler404(request, exception=None):
    """Custom 404 handler for Tajma API"""
    response = JsonResponse({
        'error': 'Not Found',
        'message': 'The requested resource does not exist.',
        'status_code': 404
    })
    response.status_code = status.HTTP_404_NOT_FOUND
    return response

def handler500(request):
    """Custom 500 handler for Tajma API"""
    response = JsonResponse({
        'error': 'Internal Server Error',
        'message': 'An unexpected error occurred on our server. We have been notified and are looking into it.',
        'status_code': 500
    })
    response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    return response
