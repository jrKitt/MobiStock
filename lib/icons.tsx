import {
    FiPrinter,
    FiEdit,
    FiTrash2,
    FiX,
    FiPhone,
    FiHome,
    FiMaximize,
} from 'react-icons/fi'

export const PrintIcon = ({
    className = 'h-4 w-4',
}: {
    className?: string
}) => <FiPrinter className={className} />

export const EditIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
    <FiEdit className={className} />
)

export const DeleteIcon = ({
    className = 'h-4 w-4',
}: {
    className?: string
}) => <FiTrash2 className={className} />

export const CloseIcon = ({
    className = 'h-5 w-5',
}: {
    className?: string
}) => <FiX className={className} />

export const PhoneIcon = ({
    className = 'h-4 w-4',
}: {
    className?: string
}) => <FiPhone className={className} />

export const HomeIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
    <FiHome className={className} />
)

export const QrCodeIcon = ({
    className = 'h-4 w-4',
}: {
    className?: string
}) => <FiMaximize className={className} />
