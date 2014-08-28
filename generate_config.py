import sys
import json

if len(sys.argv) > 1:
    json_file=open('config.json', 'rb')
    data = json.load(json_file)
    json_file.close()
    if not "use_local" in data.keys():
        data["use_local"] = True
    data["wc_ip_address"] = ('ws://%s:8112/' % sys.argv[1])
    json_file=open('config.json', 'wb')
    json.dump(data, json_file,
            sort_keys=True, indent=4,
            separators=(',', ': '))
    json_file.close()
