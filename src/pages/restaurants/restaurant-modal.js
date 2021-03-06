import React from 'react';
import { Button, Icon, Modal, Form, Input } from 'semantic-ui-react';
import { connect } from 'react-redux';
import {
  deleteItem,
  editItem,
  addItem,
} from '../../shared/store/actions/restaurantActions';
import { googleMapsApiKey } from '../../config/apikeys';
import Script from 'react-load-script';
import { showNotification } from '../../shared/store/actions/notificationActions';

class ItemModal extends React.Component {
  constructor(props) {
    super(props);
    // Declare State
    this.state = {
      item: { tag: '' },
      modalOpen: false,
      isFormValid: false,
    };
  }

  static getDrivedStateFromProps(nextProps, prevState) {
    return { ...prevState, item: { tags: nextProps.item.tags } };
  }

  handleScriptLoad = () => {
    const options = {
      types: ['establishment'],
    };
    /*global google*/
    this.autocomplete = new google.maps.places.Autocomplete(
      document.getElementById('autocomplete'),
      options
    );
    this.autocomplete.setFields([
      'address_components',
      'formatted_address',
      'name',
      'url',
    ]);
    // Fire Event when a suggested name is selected
    this.autocomplete.addListener('place_changed', this.handlePlaceSelect);
  };

  handlePlaceSelect = () => {
    // Extract City From Address Object
    const addressObject = this.autocomplete.getPlace();
    const address = addressObject.address_components;

    // Check if address is valid
    if (address) {
      // Set State
      this.setState({
        item: {
          ...this.state.item,
          address: addressObject.formatted_address,
          name: addressObject.name,
          url: addressObject.url,
        },
      });
    }
  };

  handleChange = (e) => {
    let elem = e.target;
    if (elem.id === 'price') {
      elem.value = Math.max(parseInt(elem.value), 0);
    }

    let item = {
      ...this.state.item,
      [e.target.id]: e.target.value,
    };

    if (this.validateForm(item) || e.target.id === 'tag') this.setState({ item });
  };

  validateForm(item = this.state.item) {
    const isValid = item.name && item.address && !!parseInt(item.price);
    this.setState({ isFormValid: isValid });
    return isValid;
  }

  addTag = () => {
    let currTags = this.state.item.tags || [];
    let inputTag = this.state.item.tag;

    if (!inputTag) {
      let notificationConfig = {
        iconName: 'warning',
        iconColor: 'red',
        title: 'Invalid Tag',
        sec: 3,
      };
      this.props.showNotification(notificationConfig);
      return;
    }
    inputTag.trim();
    let existingTagFromCol = this.props.tags.filter(
      (tag) => tag.value === inputTag.toLowerCase()
    );
    if (existingTagFromCol.length) inputTag = existingTagFromCol[0].text;
    if (currTags.indexOf(inputTag) !== -1 || !inputTag) return;

    this.setState({
      item: { ...this.state.item, tags: [...currTags, inputTag], tag: '' },
    });

    this.validateForm();
  };

  deleteTag(tag) {
    let currTags = this.state.item.tags || [];
    let updatedTags = currTags.filter((currTag) => currTag !== tag);
    this.setState({ item: { ...this.state.item, tags: updatedTags } });
    /*this.props.showNotification({
      iconName: 'check',
      iconColor: 'green',
      text: `Tag "${tag}" removed. Click "Edit" button to submit changes.`,
      sec: 3,
    });*/
    this.validateForm();
  }

  openModal = () => {
    this.setState({ modalOpen: true, item: this.props.item, tag: '' });
  };

  closeModal = () => {
    this.setState({
      modalOpen: false,
      item: this.props.item || { name: '', address: '', comments: '' },
    });
  };

  addData = () => {
    this.props.addItem(this.state.item);
    this.closeModal();
  };

  editData = () => {
    this.props.editItem(this.state.item);
    this.closeModal();
  };

  deleteData = () => {
    this.props.deleteItem(this.props.item.id);
    this.closeModal();
  };

  render() {
    let action = {
      edit: { title: 'Edit', color: 'blue' },
      delete: { title: 'Delete', color: 'red' },
      add: { title: 'Add', color: 'green' },
    };

    let actionButton;

    if (this.props.type === 'add') {
      actionButton = (
        <Button
          type='button'
          color={action.add.color}
          onClick={this.addData}
          disabled={!this.state.isFormValid}
        >
          Add
        </Button>
      );
    } else if (this.props.type === 'delete') {
      actionButton = (
        <Button type='button' color={action.delete.color} onClick={this.deleteData}>
          Delete
        </Button>
      );
    } else if (this.props.type === 'edit') {
      actionButton = (
        <Button
          type='button'
          color={action.edit.color}
          onClick={this.editData}
          disabled={!this.state.isFormValid}
        >
          Edit
        </Button>
      );
    }

    return (
      <Modal
        trigger={
          <Button
            size='small'
            color={action[this.props.type].color}
            onClick={() => this.openModal()}
            className='restaurant-modal-button'
          >
            <Icon name={this.props.type}></Icon>
            {action[this.props.type].title}
          </Button>
        }
        open={this.state.modalOpen}
        onClose={() => {
          this.closeModal();
        }}
      >
        <Modal.Header>
          {action[this.props.type].title} restaurant: {this.props.item.name}
        </Modal.Header>
        <Modal.Content>
          <Form>
            {this.props.type !== 'delete' ? (
              <Form.Group>
                <Form.Field width={16} required={this.props.type === 'add'}>
                  <label>Search Place:</label>
                  <input
                    id='autocomplete'
                    type='text'
                    placeholder='Enter restaurant name or address'
                    onChange={this.handleChange}
                  />
                </Form.Field>
              </Form.Group>
            ) : (
              ''
            )}

            <Form.Group>
              <Form.Field
                label='Name:'
                control='input'
                value={this.state.item.name}
                placeholder='Populated by place search'
                type='text'
                id='name'
                readOnly
                width={6}
              />

              <Form.Field
                label='Address:'
                control='input'
                value={this.state.item.address}
                placeholder='Populated by place search'
                type='text'
                id='address'
                readOnly
                width={10}
              />
              <Form.Field
                label='Price'
                control='input'
                defaultValue={this.props.item.price || 0}
                onChange={this.handleChange}
                type='number'
                id='price'
                readOnly={this.props.type === 'delete'}
                required={this.props.type !== 'delete'}
                width={2}
              />
            </Form.Group>

            <Form.Group>
              <Form.Field width='5'>
                <label>Tags:</label>
                <Input
                  value={this.state.item.tag || ''}
                  onChange={this.handleChange}
                  type='text'
                  id='tag'
                  action={
                    <Button type='button' onClick={this.addTag}>
                      Add Tag
                    </Button>
                  }
                />
              </Form.Field>
            </Form.Group>

            <div className='tag-buttons'>
              {this.state.item.tags
                ? this.state.item.tags.map((tag) => (
                    <Button icon labelPosition='right' key={tag} compact basic>
                      {tag}
                      <Icon name='delete' onClick={() => this.deleteTag(tag)}></Icon>
                    </Button>
                  ))
                : null}
            </div>
            {/*}
            <Form.TextArea
              label='Comments ( additional info )'
              defaultValue={this.props.item.comments}
              onChange={this.handleChange}
              id='comments'
              readOnly={this.props.type === 'delete'}
            />*/}
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button type='button' onClick={this.closeModal}>
            Cancel
          </Button>
          {actionButton}
        </Modal.Actions>

        {this.props.type !== 'delete' ? (
          <Script
            url={`https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`}
            onLoad={this.handleScriptLoad}
          />
        ) : (
          ''
        )}
      </Modal>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    tags: state.firestore.ordered['restaurant-tags'],
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    deleteItem: (id) => {
      dispatch(deleteItem(id));
    },
    editItem: (item) => {
      dispatch(editItem(item));
    },
    addItem: (item) => {
      dispatch(addItem(item));
    },
    showNotification: (config) => {
      dispatch(showNotification(config));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ItemModal);

/*
place interface: {
  name: string;
  address: string;
  url: string;
  price: number;
  comments: string (needs to be updated into {user: string, date: Date, content: string}[])
  tags: string[] (proposed)
}
*/

/*
form: {
  name: string
  address: string
  tag: string
}
*/
