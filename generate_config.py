import sys
import json

if len(sys.argv) > 1:
    json_file=open('config.json', 'rb')
    data = json.load(json_file)
    json_file.close()
    if data["use_local"]:
        json_file=open('config.json', 'wb')

        data["wc_ip_address"] = sys.argv[1]
        json.dump(data, json_file, sort_keys=True,
            indent=4, separators=(',', ': '))
        json_file.close()
