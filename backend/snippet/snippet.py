from abc import ABC, abstractmethod

class Snippet(ABC):
    @abstractmethod
    def get_snippet(self, query, article):
        pass