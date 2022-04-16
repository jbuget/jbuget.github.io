const { autocomplete, getAlgoliaResults } = window['@algolia/autocomplete-js'];

const searchClient = algoliasearch(
  'QCHXAVB8FW',
  '3e954246f862ec28cdb3d4c0e3517c81'
);

autocomplete({
  container: '#algolia-autocomplete',
  placeholder: 'Search for products',
  getSources({ query }) {
    return [
      {
        sourceId: 'pages',
        getItems() {
          return getAlgoliaResults({
            searchClient,
            queries: [
              {
                indexName: 'jbuget.fr',
                query,
                params: {
                  hitsPerPage: 5,
                  attributesToHighlight: ['title'],
                  attributesToSnippet: ['title', 'description'],
                  snippetEllipsisText: '…',
                },
              },
            ],
          });
        },
        getItemUrl({ item }) {
          return item.relpermalink;
        },
        templates: {
          item({ item, components, html }) {
            return html`<a class="aa-ItemLink" href="${item.relpermalink}">
              <div class="aa-ItemWrapper">
                <div class="aa-ItemContent">
                  <div class="aa-ItemContentBody">
                    <div class="aa-ItemContentTitle">
                      ${components.Highlight({
                        hit: item,
                        attribute: 'title',
                      })}
                    </div>
                    <div class="aa-ItemContentDescription">
                      ${components.Snippet({
                        hit: item,
                        attribute: 'description',
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </a>`;
          },
        },
      },
    ];
  },
  navigator: {
    navigate({ itemUrl }) {
      window.location.assign(itemUrl);
    },
    navigateNewTab({ itemUrl }) {
      const windowReference = window.open(itemUrl, '_blank', 'noopener');

      if (windowReference) {
        windowReference.focus();
      }
    },
    navigateNewWindow({ itemUrl }) {
      window.open(itemUrl, '_blank', 'noopener');
    },
  },
});
