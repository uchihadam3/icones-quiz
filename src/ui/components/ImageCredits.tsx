import { ASSET_MANIFEST } from '../../data/assets';

const credited = Object.entries(ASSET_MANIFEST.entries).filter(([, asset]) => asset.status === 'ready');

export function ImageCredits() {
  if (!credited.length) return null;

  return (
    <details className="image-credits">
      <summary>Créditos das imagens ({credited.length})</summary>
      <p>As fotografias externas mantêm a atribuição e a licença indicadas abaixo. As ilustrações geradas são identificadas separadamente.</p>
      <ul>
        {credited.map(([id, asset]) => (
          <li key={id}>
            <strong>{id.replaceAll('-', ' ')}</strong> — {asset.attribution}
            {asset.sourceUrl && <>{' '}<a href={asset.sourceUrl} target="_blank" rel="noopener noreferrer">Fonte</a></>}
            {asset.licenseUrl && <>{' · '}<a href={asset.licenseUrl} target="_blank" rel="noopener noreferrer">Licença</a></>}
          </li>
        ))}
      </ul>
    </details>
  );
}
