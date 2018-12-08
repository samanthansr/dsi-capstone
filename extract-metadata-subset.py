import pandas as pd
import gzip

# reading in metadata file as a dictionary
def parse(path):
    g = gzip.open(path, 'rb')
    for l in g:
        yield eval(l)

def getDF(path):
    i = 0
    df = {}
    for d in parse(path):
        df[i] = d
        i += 1
    return df

metadata = getDF('metadata.json.gz')

df = pd.DataFrame(columns=['brand', 'price', 'related', 'categories', 'asin', 'title', 'imUrl', 'salesRank'])

# appending to df in batches
batch = []
batch_size = 500000

metadata_length = len(metadata)

for i in range(0, metadata_length):
    batch.append(metadata[i])
    if i % batch_size == 0:
        df = df.append(batch,ignore_index=True)
        batch = []
        print('Batch completed', len(df))
    if i == metadata_length - 1:
        df = df.append(batch,ignore_index=True)

# loading in reviews dataset 
def parse(path):
    g = gzip.open(path, 'rb')
    for l in g:
        yield eval(l)

def getDF(path):
    i = 0
    df = {}
    for d in parse(path):
        df[i] = d
        i += 1
    return pd.DataFrame.from_dict(df, orient='index')

reviews = getDF('reviews_Home_and_Kitchen_5.json.gz')

home_kitchen_metadata = df[df['asin'].isin(reviews['asin'].unique())]
home_kitchen_metadata.to_csv('home-kitchen-metadata.csv')