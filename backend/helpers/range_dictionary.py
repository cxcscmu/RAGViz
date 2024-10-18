def create_range_dictionary(file_path):
    range_list = []
    with open(file_path, 'r') as file:
        for line in file:
            # Assuming each line contains two numbers separated by a tab
            start, end = map(int, line.strip().split('\t'))
            # Append the range as a tuple to the list
            range_list.append((start, end))
    return range_list

def query_range_dictionary(range_list, query):
    for i, (start, end) in enumerate(range_list):
        if start <= query < end:
            return i, query - start
    return 0