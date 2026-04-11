from pytrends.request import TrendReq
import json
from datetime import datetime

pytrends = TrendReq(hl='en-US', tz=360)
trending = pytrends.trending_searches(pn='united_states')
google_top = trending[0].tolist()[:20]

output = {
    "date": datetime.now().strftime("%Y-%m-%d"),
    "google_trending": google_top
}

print(json.dumps(output, indent=2))
