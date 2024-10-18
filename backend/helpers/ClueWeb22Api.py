
import os
import gzip

class ClueWeb22Api:

    def __init__(self, cw22id, cw22root_path):
        self.cw22id = cw22id
        self.cw22root_path = cw22root_path

    def get_base_filename_by_id(self, cw22id, cw22root_path, file_type='html'):
        html_path = self.cw22root_path + os.sep + file_type
        id_parts = cw22id.split('-')
        doc = int(id_parts[len(id_parts) - 1])

        language = id_parts[1][:2]
        segment = id_parts[1][:4]
        directory = id_parts[1]
        base_path = html_path + os.sep + language + os.sep + segment + os.sep + directory + os.sep
        base_filename = base_path + id_parts[1] + '-' + id_parts[2]
        return base_filename

    def get_primary_node_ids(self, annotate_html):
        annotations = annotate_html.annotations
        primary_node_ids = []
        for annotation in annotations:
            if annotation.type == AnnotateHtml.AnnotationType.Primary:
                primary_node_ids.append(int(annotation.nodeId))
        primary_node_ids.sort()
        return primary_node_ids

    def get_html_from_warc(self):
        cw22id = self.cw22id
        cw22root_path = self.cw22root_path
        base_filename = self.get_base_filename_by_id(cw22id, cw22root_path)

        warc_path = base_filename + '.warc.gz'
        offset_path = base_filename + '.warc.offset'

        id_parts = cw22id.split('-')
        doc = int(id_parts[len(id_parts) - 1])

        #Get html from warc using offset
        offset_length = len('{:010d}\n'.format(0, 0))
        with open (warc_path,'rb') as f_warc:
            with open (offset_path, 'r') as f_offset:
                f_offset.seek(int(doc) * int(offset_length))
                start_bytes = int (f_offset.read (offset_length).strip())
                end_bytes =   int (f_offset.read (offset_length).strip())
                f_warc.seek(start_bytes)
                record = f_warc.read(end_bytes - start_bytes)
                record = gzip.decompress(record).decode('utf-8')

                #Remove the WARC header to get the htmlStr
                warc_header = ''
                for line in record.splitlines():
                    warc_header += line
                    warc_header += '\r\n'
                    if len(line.strip()) == 0:
                        break
                record = record[len(warc_header):]

                return record
    
    def get_node_features(self):
        cw22id = self.cw22id
        cw22root_path = self.cw22root_path
        base_filename = self.get_base_filename_by_id(cw22id, cw22root_path, file_type='vdom')
        vdom_path = base_filename + '.zip'

        with zipfile.ZipFile(vdom_path, 'r') as z:
            doc_num = 0
            filename = cw22id + '.bin'
            with z.open(filename) as f:
                data = f.read()
                annotate_html = AnnotateHtml()
                annotate_html.ParseFromString(data)

                html_string = self.get_html_from_warc()
                api = AnnotateHtmlApi(annotate_html, init_nodes=False, html_string=html_string)
                vdom_features = api.get_all_node_features_no_offset()
                return vdom_features

    def get_node_features_with_text(self, is_primary=True):
        cw22id = self.cw22id
        cw22root_path = self.cw22root_path
        base_filename = self.get_base_filename_by_id(cw22id, cw22root_path, file_type='vdom')
        vdom_path = base_filename + '.zip'

        json_path = base_filename + '.json.gz'
        offset_path = base_filename + '.offset'

        id_parts = cw22id.split('-')
        doc = int(id_parts[len(id_parts) - 1])

        nodes_and_features = []
        with zipfile.ZipFile(vdom_path, 'r') as z:
            doc_num = 0
            filename = cw22id + '.bin'
            with z.open(filename) as f:
                data = f.read()
                annotate_html = AnnotateHtml()
                annotate_html.ParseFromString(data)

                html_string = self.get_html_from_warc()
                api = AnnotateHtmlApi(annotate_html, init_nodes=True, html_string=html_string)

                all_soup_nodes = api.soup.find_all()
                primary_node_ids = all_soup_nodes
                if is_primary:
                    primary_node_ids = self.get_primary_node_ids(annotate_html)
                    
                htmlnode_vdomfeatures = {}
                for htmlnode in all_soup_nodes:
                    #print(htmlnode)
                    node_text = htmlnode.text.strip()
                    if 'data-dcnode-id' in htmlnode.attrs and len(node_text) > 0:
                        nodeid = int(htmlnode.attrs['data-dcnode-id'])
                        if nodeid in primary_node_ids:
                            vdom_feature = api.all_nodes[nodeid].vdom_feature
                            node_dict = {'id': nodeid, 'text':htmlnode.text, 'vdom_feature':vdom_feature}
                            nodes_and_features.append(node_dict)
                            #htmlnode_vdomfeatures[nodeid] = vdom_feature
        return nodes_and_features


    def get_primary_content_with_annotations(self):
        cw22id = self.cw22id
        cw22root_path = self.cw22root_path
        base_filename = self.get_base_filename_by_id(cw22id, cw22root_path, file_type='vdom')
        vdom_path = base_filename + '.zip'
        
        id_parts = cw22id.split('-')
        doc = int(id_parts[len(id_parts) - 1])

        with zipfile.ZipFile(vdom_path, 'r') as z:
            doc_num = 0
            filename = cw22id + '.bin'
            with z.open(filename) as f:
                data = f.read()
                annotate_html = AnnotateHtml()
                annotate_html.ParseFromString(data)

                html_string = self.get_html_from_warc()
                api = AnnotateHtmlApi(annotate_html, init_nodes=True, html_string=html_string)
                primary_content_with_offset = api.get_primary_content_with_annotation_offset(get_binary_text=True)
                return primary_content_with_offset

    def get_json_record(self, record_type):
        cw22id = self.cw22id
        cw22root_path = self.cw22root_path
        base_filename = self.get_base_filename_by_id(cw22id, cw22root_path, file_type=record_type)

        json_path = base_filename + '.json.gz'
        offset_path = base_filename + '.offset'

        id_parts = cw22id.split('-')
        doc = int(id_parts[len(id_parts) - 1])

        offset_length = len('{:010d}\n'.format(0, 0))
        with open (json_path,'rb') as f_json:
            with open (offset_path, 'r') as f_offset:
                f_offset.seek(int(doc) * int(offset_length))
                start_bytes = int (f_offset.read (offset_length).strip())
                end_bytes =   int (f_offset.read (offset_length).strip())
                f_json.seek(start_bytes)
                record = f_json.read(end_bytes - start_bytes)
                record = gzip.decompress(record).decode('utf-8')
                return record


    def get_clean_text(self):
        record = self.get_json_record('txt')
        return record

    def get_inlinks(self):
        record = self.get_json_record('inlink')
        return record

    def get_outlinks(self):
        record = self.get_json_record('outlink')
        return record


