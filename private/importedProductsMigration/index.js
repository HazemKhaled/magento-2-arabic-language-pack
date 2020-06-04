const fs = require('fs');
const { Client: Elasticsearch } = require('@elastic/elasticsearch');
const AppSearchClient = require('@elastic/app-search-node');

let config = {
  currentWorkingDate: undefined,
  currentRemainingLaps: undefined,
  currentFinishEstimation: undefined,
};

const appSearchClient = new AppSearchClient(
  undefined,
  process.env.APP_SEARCH_KEY,
  () => process.env.APP_SEARCH_BASEURL,
);
const ESClient = new Elasticsearch({
  node: process.env.ELASTIC_URL,
  auth: {
    username: String(process.env.ELASTIC_USER),
    password: String(process.env.ELASTIC_PASSWORD),
  },
});

async function run() {

  const startDate = Date.now();

  const {
    body: {
      _scroll_id: scrollId,
      hits: {
        total: { value: totalInstancesToMigrate },
        hits: instances,
      },
    },
  } = await productsSearch();

  const laps = Math.floor(totalInstancesToMigrate / 100);
  let i = 0;

  await updateProducts(instances);

  progressUpdate(startDate, i, laps);

  for (i = 1; i <= laps; i++) {
    const {
      body: {
        hits: { hits: productsInstances },
      },
    } = await ESClient.scroll({
      scroll_id: scrollId,
      scroll: '1m',
    });

    await updateProducts(productsInstances);

    progressUpdate(startDate, i, laps);

  }
}

async function updateProducts(instances) {
  const skus = getSkusArray(instances);

  const products = await appSearchClient.getDocuments('catalog', skus);

  const updateArr = getUpdateArray(products, instances);

  if (updateArr.length) {
    await appSearchClient.updateDocuments('catalog', updateArr);
    updatedProductsSkusToFile(updateArr);
  }

  saveNotFoundProducts(products, instances);

  config.currentWorkingDate = instances[instances.length-1]._source.createdAt;
}

function getUpdateArray(products, instances) {
  return products.reduce((a, p) => {
    if (!p) return a;
    a.push({
      id: p.sku,
      imported: (p.imported || []).concat(
        instances.reduce(
          (accumulator, { _source: { sku, siteUrl } }) =>
            sku === p.sku &&
            !(p.imported || []).includes(siteUrl) &&
            !accumulator.includes(siteUrl)
              ? accumulator.push(siteUrl) && accumulator
              : accumulator,
          [],
        ),
      ),
    });
    return a;
  }, []);
}

function productsSearch() {
  return ESClient.search({
    index: 'products-instances',
    scroll: '1m',
    size: 100,
    sort: ['createdAt'],
    body: {
      query: {
        bool: {
          must: [
            {
              exists: {
                field: 'createdAt',
              },
            },
            {
              range: {
                createdAt: {
                  gte: new Date(config.currentWorkingDate),
                },
              },
            },
          ],
          must_not: [
            {
              exists: {
                field: 'deleted',
              },
            },
            {
              term: {
                archive: true,
              },
            },
          ],
        },
      },
    },
  });
}

function getSkusArray(instances) {
  return instances.reduce((a, { _source: { sku } }) => {
    if (!a.includes(sku)) {
      a.push(sku);
    }
    return a;
  }, []);
}

function setConfig() {
  if (fs.existsSync('./config.json')) {
    const fileContent = fs.readFileSync('./config.json');
    config = JSON.parse(fileContent.toString('utf8'));
    return;
  }
  config = {
    currentWorkingDate: '2010-06-01T12:15:05.269Z',
  };
}

function updateConfig() {
  fs.writeFileSync('./config.json', JSON.stringify(config));
}

function progressUpdate(startDate, i, laps) {
  finishTimeEstimation = ((Date.now() - startDate) / (i+1)) * (laps - i) / 1000 / 60;
  clearConsoleAndScrollBackBuffer();
  console.log('Migration Script In Progress');
  console.log('Progress: ', ((i + 1)/laps*100).toFixed(2), '%');
  console.log('Time Estimation: ', finishTimeEstimation.toFixed(2), 'Minutes');
  console.log('Last working date: ', config.currentWorkingDate);
  if (i === laps) console.log('Mission Finished!');
  config.currentRemainingLaps = laps - i;
  config.currentFinishEstimation = finishTimeEstimation;
}


function clearConsoleAndScrollBackBuffer() {
  process.stdout.write('\u001b[3J\u001b[2J\u001b[1J');
  console.clear();
}

function updatedProductsSkusToFile(updateArray) {
  return fs.appendFile('./skus.txt', updateArray.reduce((a, obj) => {
    return `${a}${obj.id},`;
  }, ''), () => {});
}

function updateMissingInstancesProductsFile(idArr) {
  return fs.appendFile('./missingInstanceData.txt', `${JSON.stringify(idArr).slice(1,-1)},`, () => {});
}

function saveNotFoundProducts(productsList, instances) {
  const productsSkus = productsList.filter(p => p).map(p => p.sku);
  const missingInstanceProductsIds = instances.reduce((a, instance) => {
    if (!productsSkus.includes(instance._source.sku)) {
      a.push(instance._id);
    }
    return a;
  }, []);
  if (missingInstanceProductsIds.length)
    updateMissingInstancesProductsFile(missingInstanceProductsIds);
}

setConfig();
process.on('SIGINT', () => {
  process.exit(0);
});

process.on('exit', () => {
  updateConfig();
});

run().catch(e => {console.error(e); updateConfig();});

