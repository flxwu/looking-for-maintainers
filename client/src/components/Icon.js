import { h } from 'preact';
const IconURI = title => `/assets/icons/${title}.svg`;

const Icon = props => (
  <img
    src={IconURI(props.type)}
    width={props.width || 50}
    height={props.height || 50}
    {...props}
  />
);

export default Icon;
