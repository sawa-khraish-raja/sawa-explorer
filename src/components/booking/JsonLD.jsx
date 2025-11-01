import React from 'react';

export default function JsonLD({ data }) {
  return (
    <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
