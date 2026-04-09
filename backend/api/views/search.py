from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from api.models import SearchQuery

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def track_search(request):
    """Log a search query for recommendation purposes."""
    query_text = request.data.get('q', '').strip()
    
    if not query_text:
        return Response({'status': 'ignored'}, status=status.HTTP_200_OK)
    
    # Save the query
    SearchQuery.objects.create(
        user=request.user if request.user.is_authenticated else None,
        query=query_text
    )
    
    return Response({'status': 'tracked'}, status=status.HTTP_201_CREATED)
