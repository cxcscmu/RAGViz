import sys
sys.path.append("/home/tevinw/ragviz/backend")
from abc import ABC, abstractmethod

class Search(ABC):
    @abstractmethod
    def get_search_results(self, embedding, k, query, snippet_object):
        pass