
#----------- MODEL GOES HERE -----------#
import re
import numpy as np
import pandas as pd
from surprise import Reader, Dataset, KNNWithMeans, SVD

# loading in reviews dataset
reviews20 = pd.read_csv('./dataset/reviews20reducedpre.csv')

# loading in metadata dataset
metadata = pd.read_csv('./dataset/home-kitchen-metadata.csv')

# setting up lookup dictionaries
product_lookup = {k:v for k,v in zip(metadata['asin'], metadata['title'])}
imgurl_lookup = {k:v for k,v in zip(metadata['asin'], metadata['imUrl'])}

# cleaning up category column
def categories_to_columns(row, cat_level):
    try:
        return row[cat_level]
    except IndexError:
        return np.nan

categories = metadata.copy()
categories = categories[['asin', 'title', 'categories']]

categories['Category Path'] = categories['categories'].apply(lambda x: [cat.strip() for cat in re.sub('[\[\]\'\"]', '', x).split(',')])
categories['cat_2'] = categories['Category Path'].apply(lambda x: categories_to_columns(x,1))
categories.fillna('NA', inplace=True)

category_lookup = {k:v for k,v in zip(categories['asin'], categories['cat_2'])}

# adding category (cat_3) to reviews20 df
reviews20_cat = reviews20.copy()
reviews20_cat['cat_2'] = reviews20_cat['asin'].apply(lambda x: category_lookup[x])

ranked = reviews20_cat.groupby(['cat_2','asin']).count()['overall'].sort_values(ascending=False)

# getting top n products from each category
def get_products_subset(counts, n):
    kitchen_products = np.random.choice(list(counts.loc['Kitchen & Dining'][:n].index), 20, replace=False)
    vacuum_products = np.random.choice(list(counts.loc['Vacuums & Floor Care'][:n].index), 7, replace=False)
    storage_products = np.random.choice(list(counts.loc['Storage & Organization'][:n].index), 15, replace=False)
    bath_products = np.random.choice(list(counts.loc['Bath'][:n].index), 15, replace=False)
    
    return kitchen_products, vacuum_products, storage_products, bath_products

product_ids_per_category = get_products_subset(ranked, 50)

top_products_per_category = {
    'kitchen': product_ids_per_category[0],
    'vacuum': product_ids_per_category[1],
    'storage': product_ids_per_category[2],
    'bath': product_ids_per_category[3],
}

def hybrid_recommender(product_id_list, original_data=reviews20, n=10, ratio=0.7):
    
    # adding new_user's product_id_list into original data
    updated_data = original_data.copy()
    
    for product_id in product_id_list:
        updated_data = updated_data.append({'reviewerID': 'new_user', 'asin': product_id, 'overall':5.0},ignore_index=True)

    # generating user similarities to other users
    reader = Reader(rating_scale=(1,5))
    data = Dataset.load_from_df(updated_data, reader)
    trainset = data.build_full_trainset()

    # fitting for UUCF
    uucf = KNNWithMeans(k=1, sim_options={'name': 'pearson_baseline', 'user_based': True})
    uucf.fit(trainset)

    #fitting for SVD
    svd = SVD(n_factors=250, lr_bi=0.0001, lr_qi=0.0001, reg_bi=0.9, reg_qi=0.9, random_state=42)
    svd.fit(trainset)
    
    #ititialising user_predictions df
    user_predictions = pd.DataFrame(data=0, index=set(updated_data['asin']), columns=['uucf','svd'])
    
    # getting predictions per item
    for item in set(updated_data['asin']):
        user_predictions.loc[item,'uucf'] = uucf.predict('new_user',item).est
        user_predictions.loc[item,'svd'] = svd.predict('new_user',item).est
         
    user_recommendations = []
    
    # get uucf predictions
    user_predictions.sort_values(by='uucf', ascending=False, inplace=True)
    for item_id in user_predictions.index:
        if len(user_recommendations) == (n * ratio):
            break
        else:
            if item_id not in (user_recommendations or product_id_list):
                user_recommendations.append(item_id)
    
    # get svd predictions
    user_predictions.sort_values(by='svd', ascending=False, inplace=True)
    for item_id in user_predictions.index:
        if len(user_recommendations) == n:
            break
        else:
            if item_id not in (user_recommendations or product_id_list):
                user_recommendations.append(item_id)
                
    user_recommendations = [{'id':item_id, 'name': product_lookup[item_id], 'imgurl': imgurl_lookup[item_id]} for item_id in user_recommendations]
    
    return user_recommendations

#----------- ROUTES GOES HERE -----------#
import flask
app = flask.Flask(__name__)

@app.route('/')
def main_page():
    return '''
    <body>
    <h1> MAH RECOMMENDER SYSTEMMEMMEMEMEM!!!!! </h1>
    </body>
    '''

@app.route('/select_products')
def select_products():

    top_products_per_category = {
    'kitchen': product_ids_per_category[0],
    'vacuum': product_ids_per_category[1],
    'storage': product_ids_per_category[2],
    'bath': product_ids_per_category[3],
    }

    global_product_catalog = {}

    for product_list in top_products_per_category:
        global_product_catalog[product_list] = [{'id':item_id, 'name':product_lookup[item_id], 'imgurl': imgurl_lookup[item_id]} for item_id in top_products_per_category[product_list]]

    return flask.render_template('select_products.html',
                                 global_product_catalog=global_product_catalog)

@app.route('/recommend', methods=["GET"])
def recommend():
    product_id_list = flask.request.args['product_id_list'].split(',')
    n = int(flask.request.args['n'])
    ratio = float(flask.request.args['ratio'])

    recommendations = hybrid_recommender(product_id_list, reviews20, n, ratio)
    return flask.jsonify(recommendations)

# test: http://127.0.0.1:5000/recommend?product_id_list=B000IVAJE8,B00H5F3GRW,B0002IES80,B00CA5FFX0,B003PBHGHG&n=10&ratio=0.7

@app.route('/random-recommend', methods=["GET"])
def random_recommend():
    random_ids = np.random.choice(reviews20['asin'],10, replace=False)
    random_recommendations = [{'id':item_id, 'name':product_lookup[item_id],'imgurl': imgurl_lookup[item_id]} for item_id in random_ids]
    
    return flask.jsonify(random_recommendations)

if __name__ == '__main__':
    HOST = '127.0.0.1'
    PORT = 4000
    app.run(HOST, PORT)