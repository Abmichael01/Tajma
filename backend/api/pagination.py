from rest_framework.pagination import PageNumberPagination


class MessagePagination(PageNumberPagination):
    """
    Custom pagination for messages.
    Messages are paginated with 50 messages per page (larger than default for chat).
    """
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100


class SavedAdPagination(PageNumberPagination):
    """
    Custom pagination for saved ads.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

